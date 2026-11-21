/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuAnkiMedia1795305600000 } from '../../../../../backend/migration/1795305600000-FukushuAnkiMedia.js';
import { FukushuLearningSettings1795053600000 } from '../../../../../backend/migration/1795053600000-FukushuLearningSettings.js';
import { FukushuUpstreamStore1794924000000 } from '../../../../../backend/migration/1794924000000-FukushuUpstreamStore.js';
import { FukushuStudy1794891600000 } from '../../../../../backend/migration/1794891600000-FukushuStudy.js';
import { FukushuStore } from '../../backend/store.js';
import { review } from '../../backend/fsrs.js';
import { FukushuStudyStore } from '../../backend/study-store.js';
import { FukushuBackupStore } from '../../backend/backup-store.js';
import { FukushuBackupRestorer } from '../../backend/backup-restore.js';
import { decodeBackup, encodeBackup } from '../../backend/backup-codec.js';
import { backupFixture, mediaBackupFixture } from './backup-fixture.js';
import { material } from './fixture.js';
import type { StudyReviewInput } from '../../shared/study.schema.js';

const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('atomic native restore PostgreSQL', () => {
	// All raw migrations and queries stay in this suite-owned schema, independent
	// of the material tests' public tables and nondeterministic test-file order.
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', schema: 'fukushu_restore_test', extra: { options: '-c search_path=fukushu_restore_test', max: 4 }, entities, synchronize: false });
	let schemaCreated = false;
	let now = new Date('2026-11-17T00:00:00.000Z');
	let sequence = 0;
	const materials = new FukushuStore(db);
	const backups = new FukushuBackupStore(db, () => new Date(now));
	const study = new FukushuStudyStore(db, () => new Date(now));
	const request = (overrides: Partial<StudyReviewInput> = {}): StudyReviewInput => ({ id: 'deck-original', questionId: 'card-original', questionVersion: 1, expectedStateRevision: 0, requestId: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}`, rating: 'good', durationMs: 0, ...overrides });
	const files = new Map<string, Buffer>();
	const reader = { read: vi.fn(async (_owner: string, id: string) => { const value = files.get(id); if (!value) throw new Error('Missing fixture'); return value; }) };
	const restorer = new FukushuBackupRestorer(db, reader);
	const counts = async () => (await db.query('SELECT (SELECT COUNT(*)::integer FROM fukushu_review_log) AS logs, (SELECT COUNT(*)::integer FROM fukushu_study_state) AS states, (SELECT COUNT(*)::integer FROM fukushu_question_version) AS versions'))[0];
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE SCHEMA fukushu_restore_test');
		schemaCreated = true;
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		await db.query('CREATE TABLE drive_file (id varchar(32) PRIMARY KEY, "userId" varchar(32) REFERENCES "user"(id), "userHost" text, uri text, "isLink" boolean NOT NULL DEFAULT false, size integer NOT NULL, md5 text NOT NULL)');
		const runner = db.createQueryRunner();
		try {
			await new FukushuMaterial1794838800000().up(runner);
			await new FukushuMaterialManagement1794871800000().up(runner);
			await new FukushuQuestionVersions1794880800000().up(runner);
			await new FukushuStudy1794891600000().up(runner);
			await new FukushuUpstreamStore1794924000000().up(runner);
			await new FukushuLearningSettings1795053600000().up(runner);
			await new FukushuAnkiMedia1795305600000().up(runner);
		} finally { await runner.release(); }
	});
	afterAll(async () => {
		if (db.isInitialized) {
			try { if (schemaCreated) await db.query('DROP SCHEMA fukushu_restore_test CASCADE'); } finally { await db.destroy(); }
		}
	});
	beforeEach(async () => {
		await db.query('TRUNCATE "user" CASCADE');
		await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']);
		now = new Date('2026-11-17T00:00:00.000Z'); sequence = 0; files.clear(); reader.read.mockClear();
	});

	async function upload(owner: string, bytes: Buffer, id = 'backup-file') {
		files.set(id, bytes);
		await db.query('INSERT INTO drive_file (id, "userId", size, md5) VALUES ($1, $2, $3, $4)', [id, owner, bytes.length, createHash('md5').update(bytes).digest('hex')]);
		return id;
	}

	async function allRows() {
		const result = [];
		for (const table of ['fukushu_deck', 'fukushu_question', 'fukushu_question_version', 'fukushu_study_state', 'fukushu_review_log', 'fukushu_anki_media']) result.push(await db.query(`SELECT to_jsonb(t) AS value FROM ${table} t ORDER BY to_jsonb(t)::text`));
		return result;
	}

	test('retains each native review’s own retention on restore and leaves the destination preference alone', async () => {
		await materials.create('alice', material());
		const first = await study.review('alice', request());
		await db.query('INSERT INTO fukushu_learning_settings ("ownerId", data) VALUES ($1, $2)', ['alice', { newQuestionsPerDay: 5, maxReviewsPerDay: null, desiredRetention: 0.97 }]);
		now = new Date(first.card.due);
		await study.review('alice', request({ expectedStateRevision: 1 }));
		const backup = await backups.export('alice', 'deck-original');
		const original = decodeBackup(backup);
		expect(original.reviews.map(r => r.desiredRetention)).toEqual([0.9, 0.97]);
		expect(original.reviews[1].after).toEqual(review(first.card, now, 'good', 0.97).card);
		await restorer.restore('bob', await upload('bob', backup));
		expect(decodeBackup(await backups.export('bob', 'deck-original'))).toEqual(original);
		expect(await db.query('SELECT 1 FROM fukushu_learning_settings WHERE "ownerId" = $1', ['bob'])).toEqual([]);
	});

	test('restores exact retained versions, schedule, request identities and archived history without replay', async () => {
		await materials.create('alice', material());
		const req = request(); const first = await study.review('alice', req);
		await materials.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'New explanation');
		now = new Date(first.card.due);
		await study.review('alice', request({ expectedStateRevision: 1, questionVersion: 2 }));
		await materials.archive('alice', 'deck-original', 2, true);
		const bytes = await backups.export('alice', 'deck-original');
		const id = await upload('bob', bytes);
		const sourceRows = await allRows();
		expect(await restorer.restore('bob', id)).toEqual({ restored: true, deckId: 'deck-original', archived: true, questions: 1, versions: 2, studyStates: 1, reviews: 2 });
		expect(decodeBackup(await backups.export('bob', 'deck-original'))).toEqual(decodeBackup(bytes));
		expect(await study.history('bob', 'deck-original')).toEqual(await study.history('alice', 'deck-original'));
		expect(await study.review('bob', req)).toEqual(first); // Exact retry, even while archived.
		expect(await materials.showCardVersion('bob', 'deck-original', 'card-original', 1)).toEqual(await materials.showCardVersion('alice', 'deck-original', 'card-original', 1));
		const restoredRows = await allRows();
		expect(restoredRows.map(rows => rows.filter((row: { value: { ownerId: string } }) => row.value.ownerId === 'alice'))).toEqual(sourceRows);
		await expect(restorer.restore('bob', id)).rejects.toThrow('BACKUP_CONFLICT');
		expect(await allRows()).toEqual(restoredRows);
	});

	test('restores private media byte-for-byte from the backup alone and does not duplicate it on retry', async () => {
		const payload = mediaBackupFixture();
		const file = await upload('alice', encodeBackup(payload));
		await restorer.restore('alice', file);
		await db.query('DELETE FROM drive_file WHERE id = $1', [file]);
		files.delete(file);
		const exported = await backups.export('alice', payload.material.deck.id);
		const snapshot = decodeBackup(exported);
		expect(snapshot).toEqual(payload);
		expect(await backups.inspect('bob', snapshot)).toMatchObject({ version: 2, conflicts: { deck: false, questions: 0, reviews: 0 } });
		const restoredFile = await upload('bob', exported);
		await restorer.restore('bob', restoredFile);
		expect(await db.query('SELECT "ownerId", id, "mimeType", data FROM fukushu_anki_media ORDER BY "ownerId"')).toEqual(
			['alice', 'bob'].map(ownerId => ({ ownerId, id: payload.media![0].id, mimeType: 'audio/wav', data: Buffer.from(payload.media![0].data, 'base64') })),
		);
		const before = await allRows();
		await expect(restorer.restore('bob', restoredFile)).rejects.toThrow('BACKUP_CONFLICT');
		expect(await allRows()).toEqual(before);
		expect(await backups.export('bob', payload.material.deck.id)).toEqual(exported);
	});

	test('preserves virtual baseline/state and inserts more than one batch in original position order', async () => {
		const source = material();
		source.questions = Array.from({ length: 300 }, (_, i) => {
			const q = structuredClone(source.questions[0]); q.id = `q-${i}`; q.sourceKey = `key-${i}`; q.payload.id = q.id; q.payload.sourceKey = q.sourceKey; return q;
		});
		source.deck.questionCount = source.questions.length; source.deck.enabledQuestionCount = source.questions.length;
		await materials.create('alice', source);
		const bytes = await backups.export('alice', source.deck.id);
		expect(await restorer.restore('bob', await upload('bob', bytes))).toMatchObject({ questions: 300, versions: 0, studyStates: 0, reviews: 0 });
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
		expect(decodeBackup(await backups.export('bob', source.deck.id))).toEqual(decodeBackup(bytes));
	});

	test.each(['deck', 'question', 'review'] as const)('rejects %s ID collisions without altering any table', async kind => {
		const payload = backupFixture();
		const other = material(kind === 'deck' ? payload.material.deck.id : 'other-deck', kind === 'question' ? 'card-original' : 'other-card');
		await materials.create('bob', other);
		if (kind === 'deck') await materials.archive('bob', other.deck.id, 1, true);
		if (kind === 'review') await study.review('bob', request({ id: other.deck.id, questionId: other.questions[0].id, requestId: payload.reviews[0].id }));
		const before = await allRows();
		await expect(restorer.restore('bob', await upload('bob', encodeBackup(payload)))).rejects.toThrow('BACKUP_CONFLICT');
		expect(await allRows()).toEqual(before);
	});

	test.each(['foreign', 'deleted', 'changed', 'remote', 'link'] as const)('rejects a %s Drive original after read and before writes', async change => {
		const id = await upload('bob', encodeBackup(backupFixture()));
		reader.read.mockImplementationOnce(async () => {
			if (change === 'deleted') await db.query('DELETE FROM drive_file WHERE id = $1', [id]);
			else await db.query(`UPDATE drive_file SET ${change === 'foreign' ? '"userId" = \'alice\'' : change === 'changed' ? 'md5 = \'changed\'' : change === 'remote' ? '"userHost" = \'remote.example\'' : '"isLink" = true'} WHERE id = $1`, [id]);
			const bytes = files.get(id);
			if (!bytes) throw new Error('Missing fixture');
			return bytes;
		});
		await expect(restorer.restore('bob', id)).rejects.toThrow(change === 'foreign' || change === 'deleted' ? 'NO_SUCH_FILE' : 'BACKUP_FAILED');
		expect((await allRows()).every(rows => rows.length === 0)).toBe(true);
	});

	test.each(['broken', 'upstream', 'oversized'] as const)('revalidates %s bytes instead of trusting inspection', async kind => {
		const bytes = kind === 'broken' ? Buffer.from('{"format":"misskey-fukushu-deck-backup"}') : kind === 'upstream' ? Buffer.from('FUKUSHU-BACKUP-1\n') : Buffer.alloc(8 * 1024 * 1024 + 1);
		await expect(restorer.restore('bob', await upload('bob', bytes))).rejects.toThrow(kind === 'upstream' ? 'UPSTREAM_BACKUP_UNSUPPORTED' : kind === 'oversized' ? 'BACKUP_TOO_LARGE' : 'INVALID_BACKUP');
		expect((await allRows()).every(rows => rows.length === 0)).toBe(true);
	});

	test.each(['decks', 'version-count', 'version-bytes', 'review-count', 'review-bytes'] as const)('applies the correct restore policy at the former %s boundary', async kind => {
		const payload = backupFixture();
		if (kind === 'version-count') {
			payload.questions[0].currentVersion = 65;
			payload.versions = Array.from({ length: 65 }, (_, i) => ({ ...structuredClone(payload.versions[0]), version: i + 1, kind: i === 0 ? 'baseline' : 'explanation' }));
		} else {
			await materials.create('bob', material('existing', 'existing-card'));
			await study.review('bob', request({ id: 'existing', questionId: 'existing-card' }));
			if (kind === 'decks') await db.query('INSERT INTO fukushu_deck ("ownerId", id, data, revision) SELECT \'bob\', \'extra-\' || n, data, 1 FROM fukushu_deck CROSS JOIN generate_series(1,99) n WHERE id = \'existing\'');
			if (kind === 'version-bytes') await db.query('UPDATE fukushu_question_version SET "byteSize" = 33554432');
			if (kind === 'review-bytes') await db.query('UPDATE fukushu_review_log SET "byteSize" = 33554432');
			if (kind === 'review-count') await db.query('INSERT INTO fukushu_review_log ("ownerId", id, "questionId", "deckId", "questionVersion", "stateRevision", "reviewedAt", data, before, after, request, "schedulerVersion", "desiredRetention", "enableFuzz", "byteSize") SELECT "ownerId", (\'22222222-2222-4222-8222-\' || lpad(n::text,12,\'0\'))::uuid, "questionId", "deckId", "questionVersion", "stateRevision", "reviewedAt", data, before, after, request, "schedulerVersion", "desiredRetention", "enableFuzz", "byteSize" FROM fukushu_review_log CROSS JOIN generate_series(1,9999) n');
		}
		if (kind === 'review-count' || kind === 'review-bytes') {
			const result = await restorer.restore('bob', await upload('bob', encodeBackup(payload)));
			expect(result.reviews).toBe(payload.reviews.length);
			expect((await study.history('bob', result.deckId)).map(row => row.id)).toEqual(payload.reviews.map(row => row.id));
			return;
		}
		const before = await allRows();
		await expect(restorer.restore('bob', await upload('bob', encodeBackup(payload)))).rejects.toThrow('BACKUP_LIMIT');
		expect(await allRows()).toEqual(before);
	});

	// Opt-in because this exercises 10,020 real FSRS/DB writes and two complete libraries.
	test.skipIf(process.env.FUKUSHU_NATIVE_LONG_HISTORY !== '1')('round-trips v1 decks after crossing both former owner history limits', async () => {
		let total = 0;
		for (let index = 0; index < 20; index++) {
			const source = material('教材'.repeat(125) + index, '問題'.repeat(125) + index);
			const id = source.deck.id;
			const questionId = source.questions[0].id;
			await materials.create('alice', source);
			now = new Date('2026-11-17T00:00:00Z');
			for (let revision = 0; revision < 501; revision++) {
				const input = request({ id, questionId, expectedStateRevision: revision, rating: 'again' });
				const result = await study.review('alice', input);
				now = new Date(result.card.due);
				total++;
			}
			const bytes = await backups.export('alice', id);
			const restored = await restorer.restore('bob', await upload('bob', bytes, 'deck-' + index));
			expect(restored.reviews).toBe(501);
			expect((await backups.export('bob', id)).equals(bytes)).toBe(true);
		}
		expect(total).toBe(10020);
		const stats = await db.query<{ ownerId: string; count: number; bytes: number }[]>('SELECT "ownerId", COUNT(*)::integer AS count, SUM("byteSize")::integer AS bytes FROM fukushu_review_log GROUP BY "ownerId" ORDER BY "ownerId"');
		expect(stats.map(row => row.count)).toEqual([total, total]);
		expect(stats[0].bytes).toBeGreaterThan(32 * 1024 ** 2);
		expect(stats[1].bytes).toBe(stats[0].bytes);
	}, 240_000);

	test('rolls back deck, questions, versions and states after a late review insert failure', async () => {
		await materials.create('bob', material('existing', 'other'));
		const before = await allRows();
		await db.query('ALTER TABLE fukushu_review_log ADD CONSTRAINT forced_restore_failure CHECK ("byteSize" = 0)');
		try {
			await expect(restorer.restore('bob', await upload('bob', encodeBackup(backupFixture())))).rejects.toThrow('forced_restore_failure');
			expect(await allRows()).toEqual(before);
		} finally { await db.query('ALTER TABLE fukushu_review_log DROP CONSTRAINT forced_restore_failure'); }
	});

	test('rolls back the complete deck when its final media insert fails', async () => {
		const file = await upload('bob', encodeBackup(mediaBackupFixture()));
		await db.query('ALTER TABLE fukushu_anki_media ADD CONSTRAINT forced_media_failure CHECK (false)');
		try {
			await expect(restorer.restore('bob', file)).rejects.toThrow('forced_media_failure');
			expect((await allRows()).every(rows => rows.length === 0)).toBe(true);
		} finally {
			await db.query('ALTER TABLE fukushu_anki_media DROP CONSTRAINT forced_media_failure');
		}
		await expect(restorer.restore('bob', file)).resolves.toMatchObject({ restored: true });
	});

	test('serializes duplicate restores and retains exactly one complete history', async () => {
		const bytes = encodeBackup(backupFixture()); const id = await upload('bob', bytes);
		const result = await Promise.allSettled([restorer.restore('bob', id), restorer.restore('bob', id)]);
		expect(result.filter(r => r.status === 'fulfilled')).toHaveLength(1);
		expect(result.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: 'BACKUP_CONFLICT' } }]);
		expect(await counts()).toEqual({ logs: 1, states: 1, versions: 1 });
		expect(decodeBackup(await backups.export('bob', 'deck-original'))).toEqual(decodeBackup(bytes));
	});

	test('shares the creation lock with a concurrent material import', async () => {
		const id = await upload('bob', encodeBackup(backupFixture()));
		const blocker = db.createQueryRunner(); await blocker.connect(); await blocker.startTransaction();
		await blocker.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['fukushu:create:bob']);
		const restoring = restorer.restore('bob', id);
		const creating = materials.create('bob', material());
		try {
			await vi.waitFor(async () => {
				const [{ count }] = await db.query('SELECT COUNT(*)::int AS count FROM pg_locks WHERE locktype = \'advisory\' AND NOT granted');
				expect(count).toBe(2);
			});
		} finally { await blocker.commitTransaction(); await blocker.release(); }
		const results = await Promise.allSettled([restoring, creating]);
		expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
		const data = decodeBackup(await backups.export('bob', 'deck-original'));
		expect(data.reviews.length).toBe(results[0].status === 'fulfilled' ? 1 : 0);
		expect(await materials.show('bob', 'deck-original')).toMatchObject({ deck: material().deck });
	});
	test('holds the Drive row lock through all writes so ownership cannot change during restore', async () => {
		const id = await upload('bob', encodeBackup(backupFixture()));
		let release!: () => void; let reached!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		const ready = new Promise<void>(resolve => { reached = resolve; });
		const createRunner = db.createQueryRunner.bind(db); let intercepted = false;
		const spy = vi.spyOn(db, 'createQueryRunner').mockImplementation(mode => {
			const runner = createRunner(mode); const query = runner.query.bind(runner);
			runner.query = (async (sql: string, parameters?: Parameters<typeof query>[1], structured?: boolean) => {
				if (!intercepted && sql.startsWith('INSERT INTO') && sql.includes('fukushu_deck')) { intercepted = true; reached(); await gate; }
				return Reflect.apply(query, runner, [sql, parameters, structured]);
			}) as typeof runner.query;
			return runner;
		});
		const pending = restorer.restore('bob', id);
		const other = db.createQueryRunner();
		try {
			await ready; await other.connect();
			await other.query('SET lock_timeout = \'100ms\'');
			await expect(other.query('UPDATE drive_file SET "userId" = $1 WHERE id = $2', ['alice', id])).rejects.toMatchObject({ driverError: { code: '55P03' } });
		} finally { release(); spy.mockRestore(); await other.release(); }
		expect(await pending).toMatchObject({ restored: true });
		expect((await db.query('SELECT "userId" FROM drive_file WHERE id = $1', [id]))[0].userId).toBe('bob');
	});
});
