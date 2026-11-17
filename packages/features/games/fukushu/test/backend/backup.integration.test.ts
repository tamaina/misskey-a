/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuStudy1794891600000 } from '../../../../../backend/migration/1794891600000-FukushuStudy.js';
import { FukushuStore } from '../../backend/store.js';
import { FukushuStudyStore } from '../../backend/study-store.js';
import { FukushuBackupStore } from '../../backend/backup-store.js';
import { decodeBackup } from '../../backend/backup-codec.js';
import { material } from './fixture.js';
import type { StudyReviewInput } from '../../shared/study.schema.js';

const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('non-destructive backup PostgreSQL', () => {
	// All raw migrations and queries stay in this suite-owned schema, independent
	// of the material tests' public tables and nondeterministic test-file order.
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', schema: 'fukushu_backup_test', extra: { options: '-c search_path=fukushu_backup_test', max: 4 }, entities, synchronize: false });
	let now = new Date('2026-11-17T00:00:00.000Z');
	let sequence = 0;
	const materials = new FukushuStore(db);
	const backups = new FukushuBackupStore(db, () => new Date(now));
	const study = new FukushuStudyStore(db, () => new Date(now));
	const request = (overrides: Partial<StudyReviewInput> = {}): StudyReviewInput => ({ id: 'deck-original', questionId: 'card-original', questionVersion: 1, expectedStateRevision: 0, requestId: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}`, rating: 'good', durationMs: 0, ...overrides });
	const counts = async () => (await db.query('SELECT (SELECT COUNT(*)::integer FROM fukushu_review_log) AS logs, (SELECT COUNT(*)::integer FROM fukushu_study_state) AS states, (SELECT COUNT(*)::integer FROM fukushu_question_version) AS versions'))[0];
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE SCHEMA fukushu_backup_test');
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		const runner = db.createQueryRunner();
		try {
			await new FukushuMaterial1794838800000().up(runner);
			await new FukushuMaterialManagement1794871800000().up(runner);
			await new FukushuQuestionVersions1794880800000().up(runner);
			await new FukushuStudy1794891600000().up(runner);
		} finally { await runner.release(); }
	});
	afterAll(async () => {
		if (db.isInitialized) { await db.query('DROP SCHEMA fukushu_backup_test CASCADE'); await db.destroy(); }
	});
	beforeEach(async () => {
		await db.query('TRUNCATE "user" CASCADE');
		await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']);
		now = new Date('2026-11-17T00:00:00.000Z'); sequence = 0;
	});
	test('exports complete immutable history and inspects collisions without changing any stored data', async () => {
		const source = material(); await materials.create('alice', source);
		const first = await study.review('alice', request());
		await materials.updateCardExplanation('alice', source.deck.id, source.questions[0].id, 1, 'After the first review');
		now = new Date(first.card.due);
		const second = await study.review('alice', request({ expectedStateRevision: 1, questionVersion: 2 }));
		await materials.archive('alice', source.deck.id, 2, true);
		const before = await allRows();
		const bytes = await backups.export('alice', source.deck.id);
		const payload = decodeBackup(bytes);
		expect(payload.deckState).toEqual({ revision: 3, archivedAt: expect.any(String) });
		expect(payload.material.questions[0].payload.explanation?.value).toBe('After the first review');
		expect(payload.versions.map(v => v.version)).toEqual([1, 2]);
		expect(payload.versions[0].data).toEqual(source.questions[0]);
		expect(payload.reviews.map(r => r.data)).toEqual([first.record, second.record]);
		expect(payload.states[0].data.card).toEqual(second.card);
		expect(payload.reviews[1].before).toEqual(first.card);
		expect(bytes.toString()).not.toContain('ownerId');
		expect(await backups.inspect('alice', payload)).toMatchObject({ restored: false, questions: 1, versions: 2, studyStates: 1, reviews: 2, archived: true, conflicts: { deck: true, questions: 1, reviews: 2 } });
		expect(await backups.inspect('bob', payload)).toMatchObject({ restored: false, conflicts: { deck: false, questions: 0, reviews: 0 } });
		expect(await allRows()).toEqual(before);
	});

	test('does not materialize virtual baselines and conceals missing or foreign decks', async () => {
		await materials.create('alice', material());
		await expect(backups.export('bob', 'deck-original')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(backups.export('alice', 'missing')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(backups.assertOwned('bob', 'deck-original')).rejects.toThrow('NO_SUCH_MATERIAL');
		const payload = decodeBackup(await backups.export('alice', 'deck-original'));
		expect(payload.versions).toEqual([]); expect(payload.states).toEqual([]); expect(payload.reviews).toEqual([]);
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
	});

	test('separates same source IDs across owners and checks card collisions across decks', async () => {
		await materials.create('alice', material()); await study.review('alice', request());
		await materials.create('bob', material('other-deck', 'card-original'));
		const payload = decodeBackup(await backups.export('alice', 'deck-original'));
		expect(await backups.inspect('bob', payload)).toMatchObject({ conflicts: { deck: false, questions: 1, reviews: 0 } });
		const own = decodeBackup(await backups.export('bob', 'other-deck'));
		expect(own.material.deck.id).toBe('other-deck'); expect(own.reviews).toEqual([]);
	});

	test('holds one snapshot while another connection commits review and explanation edits', async () => {
		await materials.create('alice', material());
		let unblock!: () => void; let signal!: () => void;
		const gate = new Promise<void>(resolve => { unblock = resolve; });
		const reached = new Promise<void>(resolve => { signal = resolve; });
		const createRunner = db.createQueryRunner.bind(db); let intercepted = false;
		const spy = vi.spyOn(db, 'createQueryRunner').mockImplementation(mode => {
			const runner = createRunner(mode); const query = runner.query.bind(runner);
			runner.query = (async (sql: string, parameters?: Parameters<typeof query>[1], structured?: boolean) => {
				if (!intercepted && sql.startsWith('SELECT COUNT(*)::int AS count')) {
					intercepted = true; signal(); await gate;
				}
				return Reflect.apply(query, runner, [sql, parameters, structured]);
			}) as typeof runner.query;
			return runner;
		});
		const pending = backups.export('alice', 'deck-original');
		try {
			await reached;
			await study.review('alice', request());
			await materials.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'Concurrent edit');
			unblock();
			const old = decodeBackup(await pending);
			expect(old.deckState.revision).toBe(1); expect(old.versions).toEqual([]); expect(old.reviews).toEqual([]); expect(old.states).toEqual([]);
			expect(old.questions[0].currentVersion).toBe(1);
		} finally { unblock(); spy.mockRestore(); await pending.catch(() => {}); }
		const current = decodeBackup(await backups.export('alice', 'deck-original'));
		expect(current.deckState.revision).toBe(2); expect(current.versions).toHaveLength(2); expect(current.reviews).toHaveLength(1);
	});

	test('refuses oversized decompressed data without creating a partial snapshot or changing source rows', async () => {
		await materials.create('alice', material()); await study.review('alice', request());
		await db.query(`INSERT INTO fukushu_question_version ("ownerId", "questionId", version, data, "recordedAt", kind, "byteSize")
			SELECT "ownerId", "questionId", n, jsonb_set(data, '{payload,explanation}', jsonb_build_object('format', 'plain', 'value', repeat('字', 16000))), "recordedAt", 'explanation', 1
			FROM fukushu_question_version CROSS JOIN generate_series(2, 202) n WHERE version = 1`);
		const before = await counts();
		await expect(backups.export('alice', 'deck-original')).rejects.toThrow('BACKUP_TOO_LARGE');
		expect(await counts()).toEqual(before);
		expect((await materials.show('alice', 'deck-original')).questions).toEqual(material().questions);
	});

	async function allRows() {
		const rows = [];
		for (const table of ['fukushu_deck', 'fukushu_question', 'fukushu_question_version', 'fukushu_study_state', 'fukushu_review_log']) {
			rows.push(await db.query(`SELECT to_jsonb(t) AS value FROM ${table} t ORDER BY to_jsonb(t)::text`));
		}
		return rows;
	}
});
