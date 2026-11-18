/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { In, QueryFailedError } from 'typeorm';
import { BackupError, decodeBackup } from './backup-codec.js';
import { MaterialError } from './store.js';
import { MiFukushuDeck } from './models/FukushuDeck.js';
import { MiFukushuQuestion } from './models/FukushuQuestion.js';
import { MiFukushuQuestionVersion } from './models/FukushuQuestionVersion.js';
import { MiFukushuStudyState } from './models/FukushuStudyState.js';
import { MiFukushuReviewLog } from './models/FukushuReviewLog.js';
import type { FukushuBackupInspector } from './backup-drive.js';
import type { BackupRestoreResult } from '../shared/backup.schema.js';
import type { DataSource } from 'typeorm';

const jsonBytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value), 'utf8');

function* batches<T>(rows: T[]) {
	for (let offset = 0; offset < rows.length; offset += 250) yield rows.slice(offset, offset + 250);
}

export class FukushuBackupRestorer {
	constructor(private readonly db: DataSource, private readonly reader: Pick<FukushuBackupInspector, 'read'>) {}

	async restore(ownerId: string, fileId: string): Promise<BackupRestoreResult> {
		// Read the authenticated owner's original afresh; inspection is not authority.
		const bytes = await this.reader.read(ownerId, fileId);
		try {
			return await this.db.transaction('READ COMMITTED', async manager => {
				await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`fukushu:create:${ownerId}`]);
				const fileRows = await manager.query('SELECT id, "userId", "userHost", uri, "isLink", size, md5 FROM drive_file WHERE id = $1 AND "userId" = $2 FOR SHARE', [fileId, ownerId]) as { id: string; userId: string; userHost: string | null; uri: string | null; isLink: boolean; size: number; md5: string }[];
				const file = fileRows.at(0);
				if (!file || file.userId !== ownerId) throw new MaterialError('NO_SUCH_FILE');
				if (file.userHost !== null || file.uri !== null || file.isLink || file.size !== bytes.length || file.md5 !== createHash('md5').update(bytes).digest('hex')) throw new BackupError('BACKUP_FAILED');
				const payload = decodeBackup(bytes);
				const id = payload.material.deck.id;
				const decks = manager.getRepository(MiFukushuDeck);
				const questions = manager.getRepository(MiFukushuQuestion);
				const versions = manager.getRepository(MiFukushuQuestionVersion);
				const states = manager.getRepository(MiFukushuStudyState);
				const reviews = manager.getRepository(MiFukushuReviewLog);
				if (await decks.existsBy({ ownerId, id })
					|| await questions.existsBy({ ownerId, id: In(payload.questions.map(q => q.questionId)) })
					|| (payload.reviews.length > 0 && await reviews.existsBy({ ownerId, id: In(payload.reviews.map(r => r.id)) }))) {
					throw new BackupError('BACKUP_CONFLICT');
				}
				const versionRows = payload.versions.map(row => ({ ...row, ownerId, recordedAt: new Date(row.recordedAt), byteSize: jsonBytes(row.data) }));
				const reviewRows = payload.reviews.map(row => ({ ...row, ownerId, deckId: id, reviewedAt: new Date(row.reviewedAt), byteSize: [row.data, row.before, row.after, row.request].reduce((sum, value) => sum + jsonBytes(value), 0) }));
				const [{ bytes: versionBytes }] = await manager.query('SELECT COALESCE(SUM("byteSize"), 0)::text AS bytes FROM fukushu_question_version WHERE "ownerId" = $1', [ownerId]) as { bytes: string }[];
				if (await decks.countBy({ ownerId }) >= 100 || payload.questions.some(q => q.currentVersion > 64)
					|| Number(versionBytes) + versionRows.reduce((sum, row) => sum + row.byteSize, 0) > 32 * 1024 * 1024) throw new BackupError('BACKUP_LIMIT');
				await decks.insert({ ownerId, id, data: payload.material.deck, revision: payload.deckState.revision, archivedAt: payload.deckState.archivedAt ? new Date(payload.deckState.archivedAt) : null });
				const metadata = new Map(payload.questions.map(row => [row.questionId, row]));
				const questionRows = payload.material.questions.map(data => {
					const meta = metadata.get(data.id);
					if (!meta) throw new BackupError('INVALID_BACKUP');
					return { ownerId, id: data.id, deckId: id, data, position: meta.position, currentVersion: meta.currentVersion };
				});
				for (const batch of batches(questionRows)) await questions.insert(batch);
				for (const batch of batches(versionRows)) await versions.insert(batch);
				for (const batch of batches(payload.states.map(row => ({ ...row, ownerId, deckId: id })))) await states.insert(batch);
				for (const batch of batches(reviewRows)) await reviews.insert(batch);
				return { restored: true, deckId: id, archived: payload.deckState.archivedAt !== null, questions: payload.questions.length, versions: versionRows.length, studyStates: payload.states.length, reviews: reviewRows.length };
			});
		} catch (error) {
			if (error instanceof QueryFailedError && error.driverError.code === '23505') throw new BackupError('BACKUP_CONFLICT');
			throw error;
		}
	}
}
