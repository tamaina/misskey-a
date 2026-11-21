/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MAX_BACKUP_BYTES, MAX_BACKUP_VERSIONS } from '../shared/backup.schema.js';
import { MAX_ANKI_MEDIA_BYTES } from '../shared/anki-media.schema.js';
import { MiFukushuAnkiMedia } from './models/FukushuAnkiMedia.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import { MiFukushuQuestionVersion } from './models/FukushuQuestionVersion.js';
import { MiFukushuStudyState } from './models/FukushuStudyState.js';
import { MiFukushuReviewLog } from './models/FukushuReviewLog.js';
import { MaterialError } from './store.js';
import { BackupError, encodeBackup, validateBackup, validateBackupMedia } from './backup-codec.js';
import type { BackupPayload, BackupInspection } from '../shared/backup.schema.js';
import type { DataSource, EntityManager } from 'typeorm';

const collisionSources = {
	decks: { table: 'fukushu_deck', idType: 'text' },
	questions: { table: 'fukushu_question', idType: 'text' },
	reviewLogs: { table: 'fukushu_review_log', idType: 'uuid' },
} as const;

async function countConflicts(manager: EntityManager, ownerId: string, store: keyof typeof collisionSources, ids: string[]): Promise<number> {
	if (!ids.length) return 0;
	const { table, idType } = collisionSources[store];
	// Match fukushu_reject_upstream_collision, including Postgres's canonical
	// UUID spelling for native review IDs. Count each input ID only once.
	const [{ count }] = await manager.query(`
		SELECT COUNT(*)::int AS count FROM (
			SELECT id FROM ${table} WHERE "ownerId" = $1 AND id = ANY($2::${idType}[])
			UNION
			SELECT candidate.id FROM unnest($2::${idType}[]) AS candidate(id)
			JOIN fukushu_upstream_record AS source ON source."ownerId" = $1 AND source.store = $3
				AND source.key = encode(sha256(convert_to(to_jsonb(candidate.id::text)::text, 'UTF8')), 'hex')
		) AS conflicts
	`, [ownerId, ids, store]) as { count: number }[];
	return count;
}

export class FukushuBackupStore {
	constructor(private readonly db: DataSource, private readonly clock: () => Date = () => new Date()) {}

	async assertOwned(ownerId: string, id: string) {
		if (!await this.db.getRepository(MiFukushuDeck).existsBy({ ownerId, id })) throw new MaterialError('NO_SUCH_MATERIAL');
	}

	async export(ownerId: string, id: string): Promise<Buffer> {
		return this.db.transaction('REPEATABLE READ', async manager => {
			await manager.query('SET TRANSACTION READ ONLY');
			const deck = await manager.getRepository(MiFukushuDeck).findOneBy({ ownerId, id });
			if (!deck) throw new MaterialError('NO_SUCH_MATERIAL');
			let budget = Buffer.byteLength(JSON.stringify(deck), 'utf8') + 8192;
			// Count decompressed JSON, not compressed on-disk pg_column_size. Keep
			// a conservative metadata allowance before allocating ORM records.
			for (const [table, limit] of [
				['fukushu_question', 1000], ['fukushu_question_version', MAX_BACKUP_VERSIONS],
				['fukushu_study_state', 1000], ['fukushu_review_log', 10_000],
			] as const) {
				const relation = table === 'fukushu_question_version'
					? 'JOIN fukushu_question q ON q."ownerId" = r."ownerId" AND q.id = r."questionId"'
					: '';
				const deckColumn = table === 'fukushu_question_version' ? 'q."deckId"' : 'r."deckId"';
				const [size] = await manager.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(octet_length(to_jsonb(r)::text)), 0)::text AS bytes FROM ${table} r ${relation} WHERE r."ownerId" = $1 AND ${deckColumn} = $2`, [ownerId, id]) as { count: number; bytes: string }[];
				budget += Number(size.bytes) + size.count * 128;
				if (size.count > limit || budget > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			}
			const [mediaSize] = await manager.query(
				'SELECT COUNT(*)::int AS count, COALESCE(SUM(4 * ((octet_length(data) + 2) / 3)), 0)::text AS bytes FROM fukushu_anki_media WHERE "ownerId" = $1 AND "deckId" = $2',
				[ownerId, id],
			) as { count: number; bytes: string }[];
			const mediaBudget = Number(mediaSize.bytes) + mediaSize.count * 128;
			if (mediaSize.count > 2 || Number(mediaSize.bytes) > 2 * 4 * Math.ceil(MAX_ANKI_MEDIA_BYTES / 3)
				|| budget + mediaBudget > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
			const mediaRows = mediaSize.count ? await manager.getRepository(MiFukushuAnkiMedia)
				.find({ where: { ownerId, deckId: id }, order: { id: 'ASC' } }) : [];
			const questions = await manager.getRepository(MiFukushuQuestion).find({ where: { ownerId, deckId: id }, order: { position: 'ASC' } });
			const versions = await manager.getRepository(MiFukushuQuestionVersion).createQueryBuilder('v')
				.innerJoin(MiFukushuQuestion, 'q', 'q."ownerId" = v."ownerId" AND q.id = v."questionId"')
				.where('v."ownerId" = :ownerId AND q."deckId" = :id', { ownerId, id })
				.orderBy('v.questionId', 'ASC').addOrderBy('v.version', 'ASC').getMany();
			const states = await manager.getRepository(MiFukushuStudyState).find({ where: { ownerId, deckId: id }, order: { questionId: 'ASC' } });
			const reviews = await manager.getRepository(MiFukushuReviewLog).find({ where: { ownerId, deckId: id }, order: { reviewedAt: 'ASC', id: 'ASC' } });
			const payload = validateBackup({
				exportedAt: this.clock().toISOString(), material: { deck: deck.data, questions: questions.map(q => q.data) },
				...(mediaRows.length ? { media: mediaRows.map(({ id, mimeType, data }) => ({ id, mimeType, data: data.toString('base64') })) } : {}),
				deckState: { revision: deck.revision, archivedAt: deck.archivedAt?.toISOString() ?? null },
				questions: questions.map(q => ({ questionId: q.id, position: q.position, currentVersion: q.currentVersion })),
				versions: versions.map(v => ({ questionId: v.questionId, version: v.version, recordedAt: v.recordedAt.toISOString(), kind: v.kind, data: v.data })),
				states: states.map(s => ({ questionId: s.questionId, revision: s.revision, data: s.data })),
				reviews: reviews.map(r => ({ id: r.id, questionId: r.questionId, questionVersion: r.questionVersion, stateRevision: r.stateRevision,
																																	reviewedAt: r.reviewedAt.toISOString(), data: r.data, before: r.before, after: r.after, request: r.request,
																																	schedulerVersion: r.schedulerVersion, desiredRetention: r.desiredRetention, enableFuzz: r.enableFuzz })),
			});
			await validateBackupMedia(payload);
			return encodeBackup(payload);
		});
	}

	async inspect(ownerId: string, value: BackupPayload): Promise<BackupInspection> {
		const payload = validateBackup(value);
		await validateBackupMedia(payload);
		return this.db.transaction('REPEATABLE READ', async manager => {
			await manager.query('SET TRANSACTION READ ONLY');
			const deckId = payload.material.deck.id;
			return {
				format: 'misskey-fukushu-deck-backup', version: payload.media ? 2 : 1, restored: false,
				deckId, deckName: payload.material.deck.name, exportedAt: payload.exportedAt,
				archived: payload.deckState.archivedAt !== null, questions: payload.questions.length,
				versions: payload.versions.length, studyStates: payload.states.length, reviews: payload.reviews.length,
				conflicts: {
					deck: (await countConflicts(manager, ownerId, 'decks', [deckId])) > 0,
					questions: await countConflicts(manager, ownerId, 'questions', payload.questions.map(q => q.questionId)),
					reviews: await countConflicts(manager, ownerId, 'reviewLogs', payload.reviews.map(r => r.id)),
				},
			};
		});
	}
}
