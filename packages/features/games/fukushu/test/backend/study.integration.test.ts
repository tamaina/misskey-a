/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuLearningSettings1795053600000 } from '../../../../../backend/migration/1795053600000-FukushuLearningSettings.js';
import { FukushuUpstreamStore1794924000000 } from '../../../../../backend/migration/1794924000000-FukushuUpstreamStore.js';
import { FukushuStudy1794891600000 } from '../../../../../backend/migration/1794891600000-FukushuStudy.js';
import { FukushuStore } from '../../backend/store.js';
import { FukushuStudyStore } from '../../backend/study-store.js';
import { emptyStoredCard } from '../../backend/fsrs.js';
import { material } from './fixture.js';
import type { StudyReviewInput } from '../../shared/study.schema.js';

const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('private flashcard study PostgreSQL', () => {
	// All raw migrations and queries stay in this suite-owned schema, independent
	// of the material tests' public tables and nondeterministic test-file order.
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', schema: 'fukushu_study_test', extra: { options: '-c search_path=fukushu_study_test', max: 4 }, entities, synchronize: false });
	let now = new Date('2026-11-17T00:00:00.000Z');
	let sequence = 0;
	const materials = new FukushuStore(db);
	const study = new FukushuStudyStore(db, () => new Date(now));
	const request = (overrides: Partial<StudyReviewInput> = {}): StudyReviewInput => ({ id: 'deck-original', questionId: 'card-original', questionVersion: 1, expectedStateRevision: 0, requestId: `11111111-1111-4111-8111-${String(++sequence).padStart(12, '0')}`, rating: 'good', durationMs: 0, ...overrides });
	const counts = async () => (await db.query('SELECT (SELECT COUNT(*)::integer FROM fukushu_review_log) AS logs, (SELECT COUNT(*)::integer FROM fukushu_study_state) AS states, (SELECT COUNT(*)::integer FROM fukushu_question_version) AS versions'))[0];
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE SCHEMA fukushu_study_test');
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		const runner = db.createQueryRunner();
		try {
			await new FukushuMaterial1794838800000().up(runner);
			await new FukushuMaterialManagement1794871800000().up(runner);
			await new FukushuQuestionVersions1794880800000().up(runner);
			await new FukushuStudy1794891600000().up(runner);
			await new FukushuUpstreamStore1794924000000().up(runner);
			await new FukushuLearningSettings1795053600000().up(runner);
		} finally { await runner.release(); }
	});
	afterAll(async () => {
		if (db.isInitialized) { await db.query('DROP SCHEMA fukushu_study_test CASCADE'); await db.destroy(); }
	});
	beforeEach(async () => {
		await db.query('TRUNCATE "user" CASCADE');
		await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']);
		now = new Date('2026-11-17T00:00:00.000Z'); sequence = 0;
	});
	test('keeps empty state virtual at creation time and orders due cards before at most twenty new IDs', async () => {
		const source = material('deck-original', 'q00');
		source.questions = Array.from({ length: 25 }, (_, index) => {
			const card = material(source.deck.id, `q${String(index).padStart(2, '0')}`).questions[0];
			card.sourceKey = card.payload.sourceKey = card.id;
			return card;
		}).reverse();
		source.deck.questionCount = source.deck.enabledQuestionCount = 25;
		await materials.create('alice', source);
		const queue = await study.queue('alice', source.deck.id);
		expect(queue.serverTime).toBe(now.toISOString());
		expect(queue.items.map(item => item.question.id)).toEqual(Array.from({ length: 20 }, (_, i) => `q${String(i).padStart(2, '0')}`));
		expect(queue.items.every(item => item.isNew && item.questionVersion === 1 && item.stateRevision === 0 && item.due === source.questions[0].createdAt)).toBe(true);
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
		const reviewed = await study.review('alice', request({ questionId: 'q24', rating: 'again' }));
		expect((await study.queue('alice', source.deck.id)).items.map(item => item.question.id)).not.toContain('q24');
		now = new Date(reviewed.card.due);
		const due = await study.queue('alice', source.deck.id);
		expect(due.items).toHaveLength(21);
		expect(due.items[0]).toMatchObject({ question: { id: 'q24' }, isNew: false, stateRevision: 1 });
	});
	test.each(['again', 'hard', 'good', 'easy'] as const)('records %s with exact before/after state and a pinned baseline', async rating => {
		const original = material();
		original.questions[0].payload.typeAnswer = true;
		original.questions[0].payload.acceptedAnswer = 'unchanged accepted answer';
		await materials.create('alice', original);
		const input = request({ rating, durationMs: 42 });
		const result = await study.review('alice', input);
		expect(result).toMatchObject({ id: input.requestId, questionVersion: 1, stateRevision: 1, record: { correct: rating !== 'again', responseText: '', durationMs: 42, reviewedAt: now.toISOString() } });
		expect(await counts()).toEqual({ logs: 1, states: 1, versions: 1 });
		const row = (await db.query('SELECT * FROM fukushu_review_log'))[0];
		expect(row.before).toEqual(emptyStoredCard(new Date(original.questions[0].createdAt)));
		expect(row.after).toEqual(result.card);
		expect(row.data).toEqual(result.record);
		expect(row.request).toEqual(input);
		expect(row).toMatchObject({ schedulerVersion: 'ts-fsrs@5.4.1', desiredRetention: 0.9, enableFuzz: false });
		expect(row.byteSize).toBe([row.data, row.before, row.after, row.request].reduce((sum, value) => sum + Buffer.byteLength(JSON.stringify(value), 'utf8'), 0));
		expect((await db.query('SELECT data FROM fukushu_study_state'))[0].data.card).toEqual(result.card);
		expect((await materials.showCardVersion('alice', original.deck.id, original.questions[0].id, 1)).recordedAt).toBe(now.toISOString());
		expect((await materials.listCardVersions('alice', original.deck.id, original.questions[0].id)).versions[0].recordedAt).toBe(now.toISOString());
		expect(await materials.show('alice', original.deck.id)).toEqual({ ...original, revision: 1, archivedAt: null });
	});
	test('retains reviewed snapshots across explanation edits without resetting the study state', async () => {
		const original = material(); await materials.create('alice', original);
		const input = request(); const saved = await study.review('alice', input);
		const state = (await db.query('SELECT * FROM fukushu_study_state'))[0];
		await materials.updateCardExplanation('alice', original.deck.id, original.questions[0].id, 1, 'new explanation');
		expect(await counts()).toEqual({ logs: 1, states: 1, versions: 2 });
		expect((await db.query('SELECT * FROM fukushu_study_state'))[0]).toEqual(state);
		expect(await study.history('alice', original.deck.id)).toEqual([{ ...saved, question: original.questions[0] }]);
		expect(await study.review('alice', input)).toEqual(saved);
		now = new Date(saved.card.due);
		await expect(study.review('alice', request({ expectedStateRevision: 1 }))).rejects.toThrow('STUDY_CONFLICT');
		const second = await study.review('alice', request({ questionVersion: 2, expectedStateRevision: 1 }));
		expect(second.stateRevision).toBe(2);
		expect((await study.history('alice', original.deck.id))[0].question.payload.explanation?.value).toBe('new explanation');
	});
	test('serializes independent tabs and makes concurrent identical retries one durable event', async () => {
		await materials.create('alice', material());
		const input = request({ requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
		const other = new FukushuStudyStore(db, () => new Date(now));
		const retries = await Promise.all([study.review('alice', input), other.review('alice', { ...input, requestId: input.requestId.toUpperCase() })]);
		expect(retries[1]).toEqual(retries[0]);
		expect(await counts()).toEqual({ logs: 1, states: 1, versions: 1 });
		for (const changed of [{ durationMs: 1 }, { id: 'missing' }, { questionId: 'missing' }, { questionVersion: 2 }, { expectedStateRevision: 1 }, { rating: 'again' as const }]) {
			await expect(study.review('alice', { ...input, ...changed })).rejects.toThrow('STUDY_CONFLICT');
		}
		now = new Date(retries[0].card.due);
		const results = await Promise.allSettled([study.review('alice', request({ expectedStateRevision: 1 })), other.review('alice', request({ expectedStateRevision: 1 }))]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'STUDY_CONFLICT' } });
		expect(await counts()).toEqual({ logs: 2, states: 1, versions: 1 });
	});
	test('an explanation edit racing a review either follows its pinned version or rejects the stale review', async () => {
		await materials.create('alice', material());
		const [reviewed, edited] = await Promise.allSettled([
			study.review('alice', request()),
			materials.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'edited concurrently'),
		]);
		expect(edited.status).toBe('fulfilled');
		if (reviewed.status === 'fulfilled') {
			expect((await study.history('alice', 'deck-original'))[0].question).toEqual(material().questions[0]);
			expect(await counts()).toEqual({ logs: 1, states: 1, versions: 2 });
		} else {
			expect(reviewed.reason).toMatchObject({ code: 'STUDY_CONFLICT' });
			expect(await counts()).toEqual({ logs: 0, states: 0, versions: 2 });
		}
	});
	test('conceals foreign identities and isolates matching owner IDs and request UUIDs', async () => {
		await materials.create('alice', material());
		const bob = material(); bob.questions[0].payload.answer.value = 'Bob private';
		await materials.create('bob', bob);
		const input = request(); await study.review('alice', input); await study.review('bob', input);
		expect((await study.history('bob', 'deck-original'))[0].question).toEqual(bob.questions[0]);
		for (const owner of ['unknown']) {
			await expect(study.queue(owner, 'deck-original')).rejects.toThrow('NO_SUCH_MATERIAL');
			await expect(study.history(owner, 'deck-original')).rejects.toThrow('NO_SUCH_MATERIAL');
			await expect(study.review(owner, request())).rejects.toThrow('NO_SUCH_MATERIAL');
		}
		await expect(study.review('alice', request({ questionId: 'unknown' }))).rejects.toThrow('NO_SUCH_MATERIAL');
		await materials.create('bob', material('bob-only', 'bob-card'));
		const onlyBob = request({ id: 'bob-only', questionId: 'bob-card' }); await study.review('bob', onlyBob);
		await expect(study.history('alice', 'deck-original', { beforeId: onlyBob.requestId })).rejects.toThrow('NO_SUCH_MATERIAL');
	});
	test('rejects unavailable cards, stale state and future review while committed retries survive archive', async () => {
		const original = material(); await materials.create('alice', original);
		await expect(study.review('alice', request({ expectedStateRevision: 1 }))).rejects.toThrow('STUDY_CONFLICT');
		await expect(study.review('alice', request({ questionVersion: 2 }))).rejects.toThrow('STUDY_CONFLICT');
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
		const input = request(); const saved = await study.review('alice', input);
		await expect(study.review('alice', request({ expectedStateRevision: 1 }))).rejects.toThrow('STUDY_UNAVAILABLE');
		await materials.archive('alice', 'deck-original', 1, true);
		await expect(study.queue('alice', 'deck-original')).rejects.toThrow('STUDY_UNAVAILABLE');
		await expect(study.review('alice', request({ expectedStateRevision: 1 }))).rejects.toThrow('STUDY_UNAVAILABLE');
		expect(await study.review('alice', input)).toEqual(saved);
		expect(await study.history('alice', 'deck-original')).toHaveLength(1);
		const disabled = material('disabled', 'disabled'); disabled.questions[0].enabled = false; disabled.questions[0].enabledKey = 0; disabled.deck.enabledQuestionCount = 0;
		await materials.create('alice', disabled);
		expect((await study.queue('alice', 'disabled')).items).toEqual([]);
		await expect(study.review('alice', request({ id: 'disabled', questionId: 'disabled' }))).rejects.toThrow('STUDY_UNAVAILABLE');
	});
	test('rejects clock rollback and future-created cards without rewriting original dates', async () => {
		const future = material(); future.questions[0].createdAt = '2026-12-01T00:00:00.000Z';
		await materials.create('alice', future);
		expect((await study.queue('alice', future.deck.id)).items).toEqual([]);
		await expect(study.review('alice', request())).rejects.toThrow('STUDY_UNAVAILABLE');
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
		now = new Date(future.questions[0].createdAt);
		const saved = await study.review('alice', request({ rating: 'again' }));
		now = new Date(now.getTime() - 1);
		await expect(study.review('alice', request({ expectedStateRevision: saved.stateRevision }))).rejects.toThrow('STUDY_UNAVAILABLE');
		expect((await study.queue('alice', future.deck.id)).items).toEqual([]);
	});
	test('paginates by reviewed time and UUID, including archived history and rejecting a foreign deck cursor', async () => {
		const source = material();
		source.questions = ['a', 'b', 'c'].map(id => { const q = material(source.deck.id, id).questions[0]; q.sourceKey = q.payload.sourceKey = id; return q; });
		source.deck.questionCount = source.deck.enabledQuestionCount = 3;
		await materials.create('alice', source);
		const inputs = ['a', 'b', 'c'].map(questionId => request({ questionId }));
		for (const input of inputs) await study.review('alice', input);
		await materials.archive('alice', source.deck.id, 1, true);
		const first = await study.history('alice', source.deck.id, { limit: 2 });
		expect(first.map(item => item.id)).toEqual([inputs[2].requestId, inputs[1].requestId]);
		expect((await study.history('alice', source.deck.id, { beforeId: first[1].id, limit: 2 })).map(item => item.id)).toEqual([inputs[0].requestId]);
		await materials.create('alice', material('other', 'other'));
		await expect(study.history('alice', 'other', { beforeId: first[0].id })).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(study.history('alice', source.deck.id, { limit: 21 })).rejects.toThrow('INVALID_MATERIAL');
	});

	async function copyLogs(owner: string, originalId: string, count: number) {
		await db.query(`INSERT INTO fukushu_review_log ("ownerId", id, "questionId", "deckId", "questionVersion", "stateRevision", "reviewedAt", data, "before", "after", request, "schedulerVersion", "desiredRetention", "enableFuzz", "byteSize")
			SELECT l."ownerId", generated.id::uuid, l."questionId", l."deckId", l."questionVersion", l."stateRevision", l."reviewedAt",
			jsonb_set(l.data, '{id}', to_jsonb(generated.id)), l."before", l."after", jsonb_set(l.request, '{requestId}', to_jsonb(generated.id)), l."schedulerVersion", l."desiredRetention", l."enableFuzz", l."byteSize"
			FROM fukushu_review_log l CROSS JOIN (SELECT '22222222-2222-4222-8222-' || lpad(n::text, 12, '0') AS id FROM generate_series(1, $3::integer) n) generated
			WHERE l."ownerId" = $1 AND l.id = $2`, [owner, originalId, count]);
	}

	test('retains idempotent retries at the 10000-row cap and rolls back every new write', async () => {
		await materials.create('alice', material());
		const input = request(); const saved = await study.review('alice', input);
		await copyLogs('alice', input.requestId, 9999);
		await materials.archive('alice', 'deck-original', 1, true);
		await materials.create('alice', material('new', 'new'));
		await expect(study.review('alice', request({ id: 'new', questionId: 'new' }))).rejects.toThrow('STUDY_LIMIT');
		expect(await study.review('alice', input)).toEqual(saved);
		expect(await counts()).toEqual({ logs: 10000, states: 1, versions: 1 });
		expect((await materials.showCardVersion('alice', 'new', 'new', 1)).recordedAt).toBeNull();
	}, 30_000);
	test('enforces 32 MiB of actual UTF-8 history JSON independently of the row cap', async () => {
		const large = material('教'.repeat(256), '問'.repeat(256));
		await materials.create('alice', large);
		const input = request({ id: large.deck.id, questionId: large.questions[0].id });
		await study.review('alice', input);
		const row = (await db.query('SELECT * FROM fukushu_review_log'))[0];
		const count = Math.floor(32 * 1024 * 1024 / row.byteSize);
		expect(count).toBeLessThan(10000);
		await copyLogs('alice', input.requestId, count - 1);
		const other = material('材'.repeat(256), '題'.repeat(256));
		await materials.create('alice', other);
		await expect(study.review('alice', request({ id: other.deck.id, questionId: other.questions[0].id }))).rejects.toThrow('STUDY_LIMIT');
		expect(await counts()).toEqual({ logs: count, states: 1, versions: 1 });
		expect((await materials.showCardVersion('alice', other.deck.id, other.questions[0].id, 1)).recordedAt).toBeNull();
	}, 30_000);
	test('baseline version-budget failure leaves no study state or review behind', async () => {
		await materials.create('alice', material());
		await materials.updateCardExplanation('alice', 'deck-original', 'card-original', 1, 'existing');
		// Seed the aggregate accounting boundary; card-version tests independently
		// exercise 32 MiB of actual snapshot JSON and UTF-8 byte calculation.
		await db.query('UPDATE fukushu_question_version SET "byteSize" = $1 WHERE version = 1', [32 * 1024 * 1024]);
		await materials.create('alice', material('new', 'new'));
		await expect(study.review('alice', request({ id: 'new', questionId: 'new' }))).rejects.toThrow('CARD_HISTORY_LIMIT');
		expect(await counts()).toEqual({ logs: 0, states: 0, versions: 2 });
		expect((await materials.showCardVersion('alice', 'new', 'new', 1)).recordedAt).toBeNull();
	});
	test('migration round trips empty tables and refuses to discard saved state or history', async () => {
		await materials.create('alice', material());
		const migration = new FukushuStudy1794891600000();
		const runner = db.createQueryRunner();
		try {
			await migration.down(runner); await migration.up(runner);
			await study.review('alice', request());
			await expect(migration.down(runner)).rejects.toThrow('saved study state and history must be preserved');
			expect(await counts()).toEqual({ logs: 1, states: 1, versions: 1 });
			await db.query('DELETE FROM fukushu_review_log');
			await expect(migration.down(runner)).rejects.toThrow('saved study state and history must be preserved');
			expect(await counts()).toEqual({ logs: 0, states: 1, versions: 1 });
		} finally { await runner.release(); }
	});
	test('a database failure after baseline capture rolls back the baseline, state and log together', async () => {
		await materials.create('alice', material());
		await db.query('CREATE FUNCTION reject_test_review() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'injected review failure\'; END $$');
		await db.query('CREATE TRIGGER reject_test_review BEFORE INSERT ON fukushu_review_log FOR EACH ROW EXECUTE FUNCTION reject_test_review()');
		try {
			await expect(study.review('alice', request())).rejects.toThrow('injected review failure');
			expect(await counts()).toEqual({ logs: 0, states: 0, versions: 0 });
		} finally {
			await db.query('DROP TRIGGER reject_test_review ON fukushu_review_log');
			await db.query('DROP FUNCTION reject_test_review()');
		}
	});
	test('the database pins every review to an existing owner and question version', async () => {
		await materials.create('alice', material());
		await study.review('alice', request());
		await expect(db.query('UPDATE fukushu_review_log SET "questionVersion" = 999')).rejects.toMatchObject({ driverError: { code: '23503' } });
		await expect(db.query('UPDATE fukushu_review_log SET "ownerId" = $1', ['bob'])).rejects.toMatchObject({ driverError: { code: '23503' } });
		expect(await study.history('alice', 'deck-original')).toHaveLength(1);
	});
	test('owner removal cascades its state and log but leaves another owner with identical IDs', async () => {
		for (const owner of ['alice', 'bob']) { await materials.create(owner, material()); await study.review(owner, request()); }
		await db.query('DELETE FROM "user" WHERE id = $1', ['alice']);
		expect(await counts()).toEqual({ logs: 1, states: 1, versions: 1 });
		expect(await study.history('bob', 'deck-original')).toHaveLength(1);
	});
});
