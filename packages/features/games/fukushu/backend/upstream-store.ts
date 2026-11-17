/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import * as v from 'valibot';
import { readUpstreamArchive } from '../shared/upstream-reader.js';
import { studyRequestIdSchema } from '../shared/study.schema.js';
import { MAX_BACKUP_BYTES } from '../shared/backup.schema.js';
import { BackupError } from './backup-codec.js';
import { MaterialError } from './store.js';
import { StudyError } from './study-store.js';
import { UpstreamCompatibilitySession, encodeUpstreamFrames } from './pilot/upstream-session.js';
import { MiFukushuUpstreamRecord } from './models/FukushuUpstreamRecord.js';
import { MiFukushuOperationReceipt } from './models/FukushuOperationReceipt.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { UpstreamArchive, UpstreamFrame } from '../shared/upstream-reader.js';
import type { FukushuBackupInspector } from './backup-drive.js';
import type { CompatibilityReviewInput } from './pilot/upstream-session.js';

const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const key = (value: unknown) => hash(JSON.stringify(value));
export type PersistedUpstreamReview = Omit<CompatibilityReviewInput, 'reviewedAt'>;

export class FukushuUpstreamStore {
	constructor(private readonly db: DataSource, private readonly reader: Pick<FukushuBackupInspector, 'read'>, private readonly clock: () => Date = () => new Date()) {}

	private async lock(manager: EntityManager, ownerId: string) {
		await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
	}

	private async receipt(manager: EntityManager, ownerId: string, id: string, request: string) {
		const row = await manager.getRepository(MiFukushuOperationReceipt).findOneBy({ ownerId, id });
		if (row && row.request !== request) throw new StudyError('STUDY_CONFLICT');
		return row ? JSON.parse(row.result) : undefined;
	}

	async restore(ownerId: string, fileId: string, requestId: string): Promise<{ restored: true; sha256: string; records: number }> {
		const id = v.parse(studyRequestIdSchema, requestId);
		const request = JSON.stringify({ operation: 'restore', fileId });
		const prior = await this.receipt(this.db.manager, ownerId, id, request);
		if (prior) return prior;
		const bytes = await this.reader.read(ownerId, fileId);
		const archive = await readUpstreamArchive(bytes, async value => hash(value));
		const frames = archive.frames();
		try {
			return await this.db.transaction(async manager => {
				await this.lock(manager, ownerId);
				const previous = await this.receipt(manager, ownerId, id, request);
				if (previous) return previous;
				const files = await manager.query('SELECT "userId", "userHost", uri, "isLink", size, md5 FROM drive_file WHERE id = $1 AND "userId" = $2 FOR SHARE', [fileId, ownerId]);
				const file = files[0];
				if (!file) throw new MaterialError('NO_SUCH_FILE');
				if (file.userHost !== null || file.uri !== null || file.isLink || file.size !== bytes.length || file.md5 !== createHash('md5').update(bytes).digest('hex')) throw new BackupError('BACKUP_FAILED');
				const records = manager.getRepository(MiFukushuUpstreamRecord);
				const existing = await records.find({ where: { ownerId }, select: { store: true, key: true } });
				const occupied = new Set(existing.map(row => `${row.store}:${row.key}`));
				// Native IDs are queried as text; source IDs are never coerced to UUID or truncated.
				for (const [table, store] of [['fukushu_deck', 'decks'], ['fukushu_question', 'questions'], ['fukushu_review_log', 'reviewLogs']]) {
					const rows = await manager.query(`SELECT id::text AS id FROM ${table} WHERE "ownerId" = $1`, [ownerId]);
					for (const row of rows) occupied.add(`${store}:${key(row.id)}`);
				}
				for (const frame of frames) if (occupied.has(`${frame.store}:${key(frame.value.id ?? frame.value.questionId)}`)) throw new BackupError('BACKUP_CONFLICT');
				const rows = frames.map((frame, position) => ({ ownerId, store: frame.store, key: key(frame.value.id ?? frame.value.questionId), data: JSON.stringify(frame.value), blob: frame.blob === undefined ? null : Buffer.from(frame.blob), revision: 0, position, sourceHash: archive.fileSha256 }));
				for (let offset = 0; offset < rows.length; offset += 100) await records.insert(rows.slice(offset, offset + 100));
				const result = { restored: true as const, sha256: archive.fileSha256, records: rows.length };
				await manager.getRepository(MiFukushuOperationReceipt).insert({ ownerId, id, request, result: JSON.stringify(result) });
				return result;
			});
		} catch (error) {
			if (error instanceof QueryFailedError && error.driverError.code === '23505') throw new BackupError('BACKUP_CONFLICT');
			throw error;
		}
	}

	private async read(manager: EntityManager, ownerId: string): Promise<{ archive: UpstreamArchive; rows: MiFukushuUpstreamRecord[] }> {
		const [budget] = await manager.query('SELECT COUNT(*)::integer AS count, COALESCE(SUM(octet_length(data) + COALESCE(octet_length(blob), 0)), 0)::text AS bytes FROM fukushu_upstream_record WHERE "ownerId" = $1', [ownerId]);
		if (budget.count === 0) throw new MaterialError('NO_SUCH_MATERIAL');
		if (budget.count > 20_000 || Number(budget.bytes) > MAX_BACKUP_BYTES) throw new BackupError('BACKUP_TOO_LARGE');
		const rows = await manager.getRepository(MiFukushuUpstreamRecord).find({ where: { ownerId }, order: { position: 'ASC', store: 'ASC', key: 'ASC' } });
		const frames: UpstreamFrame[] = rows.map(row => ({ store: row.store as UpstreamFrame['store'], value: JSON.parse(row.data), ...(row.blob === null ? {} : { blob: new Uint8Array(row.blob) }) }));
		return { archive: await encodeUpstreamFrames(frames), rows };
	}

	async show(ownerId: string) {
		return this.db.transaction('REPEATABLE READ', async manager => {
			const { archive, rows } = await this.read(manager, ownerId);
			return { records: archive.normalizedRecords(), revisions: rows.filter(row => row.store === 'studyStates').map(row => ({ questionId: String(JSON.parse(row.data).questionId), revision: row.revision })) };
		});
	}

	async export(ownerId: string): Promise<Buffer> {
		return this.db.transaction('REPEATABLE READ', async manager => Buffer.from((await this.read(manager, ownerId)).archive.originalBytes()));
	}

	async review(ownerId: string, input: PersistedUpstreamReview) {
		const id = v.parse(studyRequestIdSchema, input.requestId);
		// Stable identity does not include server time. Never accept a caller-supplied owner/time.
		const request = JSON.stringify({ operation: 'review', questionId: input.questionId, expectedRevision: input.expectedRevision, rating: input.rating, correct: input.correct, answers: input.answers, durationMs: input.durationMs });
		return this.db.transaction(async manager => {
			await this.lock(manager, ownerId);
			const previous = await this.receipt(manager, ownerId, id, request);
			if (previous) return previous;
			if (await manager.query('SELECT 1 FROM fukushu_review_log WHERE "ownerId" = $1 AND id = $2::uuid', [ownerId, id]).then(rows => rows.length > 0)) throw new StudyError('STUDY_CONFLICT');
			const { archive, rows } = await this.read(manager, ownerId);
			const state = rows.find(row => row.store === 'studyStates' && row.key === key(input.questionId));
			if (!state || state.revision !== input.expectedRevision || state.revision === 2_147_483_647) throw new StudyError('STUDY_CONFLICT');
			const session = await UpstreamCompatibilitySession.open(archive.originalBytes());
			const result = await session.recordReview({ ...input, requestId: id, expectedRevision: 0, reviewedAt: this.clock().toISOString() });
			const updated = await readUpstreamArchive(session.export(), async value => hash(value));
			const nextState = updated.frames().find(frame => frame.store === 'studyStates' && frame.value.questionId === input.questionId)!;
			const nextLog = updated.frames().find(frame => frame.store === 'reviewLogs' && frame.value.id === id)!;
			result.revision = state.revision + 1;
			const records = manager.getRepository(MiFukushuUpstreamRecord);
			await records.update({ ownerId, store: state.store, key: state.key }, { data: JSON.stringify(nextState.value), revision: result.revision });
			await records.insert({ ownerId, store: 'reviewLogs', key: key(id), data: JSON.stringify(nextLog.value), blob: null, revision: 0, position: Math.max(...rows.map(row => row.position)) + 1, sourceHash: state.sourceHash });
			await manager.getRepository(MiFukushuOperationReceipt).insert({ ownerId, id, request, result: JSON.stringify(result) });
			return result;
		});
	}
}
