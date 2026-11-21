/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import { isFukushuBackupFile } from '@features/drive/backend/utility/fukushu-file-type.js';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuAnkiMedia1795305600000 } from '../../../../../backend/migration/1795305600000-FukushuAnkiMedia.js';
import { FukushuLearningSettings1795053600000 } from '../../../../../backend/migration/1795053600000-FukushuLearningSettings.js';
import { FukushuStudy1794891600000 } from '../../../../../backend/migration/1794891600000-FukushuStudy.js';
import { FukushuUpstreamStore1794924000000 } from '../../../../../backend/migration/1794924000000-FukushuUpstreamStore.js';
import { FukushuUpstreamStore } from '../../backend/upstream-store.js';
import { FukushuBackupInspector } from '../../backend/backup-drive.js';
import { processApkgJob } from '../../backend/jobs/ImportFukushuProcessorService.js';
import { decodeStagedApkg } from '../../backend/jobs/apkg-process.mjs';
import { FukushuDeckHistoryIndex1794990000000 } from '../../../../../backend/migration/1794990000000-FukushuDeckHistoryIndex.js';
import { FukushuMaterialBytes1794980000000 } from '../../../../../backend/migration/1794980000000-FukushuMaterialBytes.js';
import { FukushuSourceChunks1794974400000 } from '../../../../../backend/migration/1794974400000-FukushuSourceChunks.js';
import { FukushuReminder1795040000000 } from '../../../../../backend/migration/1795040000000-FukushuReminder.js';
import { FukushuReminderStore } from '../../backend/reminder-store.js';
import { FukushuBackupStore } from '../../backend/backup-store.js';
import { FukushuStudyStore } from '../../backend/study-store.js';
import { FukushuStore } from '../../backend/store.js';
import { scanSourceArchive } from '../../shared/source-scan.js';
import { readUpstreamArchive } from '../../shared/upstream-reader.js';
import { encodeUpstreamFrames } from '../../backend/pilot/upstream-session.js';
import { material } from './fixture.js';
import type { EntitySubscriberInterface } from 'typeorm';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import type { DriveSnapshot } from '../../backend/backup-drive.js';

const sha = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const bytes = readFileSync('../features/games/fukushu/test/backend/fixtures/actual-upstream/actual-upstream.fukushu');
const expected = JSON.parse(readFileSync('../features/games/fukushu/test/backend/fixtures/actual-upstream/expected-continuation.json', 'utf8'));
const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('persistent source-shaped Fukushu', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', schema: 'fukushu_upstream_test', extra: { options: '-c search_path=fukushu_upstream_test', max: 4 }, entities, synchronize: false });
	const files = new Map<string, Buffer>();
	const snapshot = (content: Buffer): DriveSnapshot => ({ blob: new Blob([new Uint8Array(content)]), md5: createHash('md5').update(content).digest('hex'), sha256: createHash('sha256').update(content).digest('hex') });
	const reader = { withSource: async <T>(_owner: string, id: string, use: (file: DriveSnapshot) => Promise<T>) => use(snapshot(files.get(id)!)) };

	async function exported(instance: FukushuUpstreamStore, owner: string) {
		const parts: Buffer[] = [];
		await instance.writeExport(owner, async bytes => { parts.push(bytes); });
		return Buffer.concat(parts);
	}

	const makeStore = () => new FukushuUpstreamStore(db, reader, () => new Date(expected.reset.request.reviewedAt));
	const store = makeStore();
	const counts = async () => (await db.query('SELECT (SELECT COUNT(*)::integer FROM fukushu_upstream_record) AS records, (SELECT COUNT(*)::integer FROM fukushu_operation_receipt) AS receipts'))[0];
	beforeAll(async () => {
		await db.initialize(); await db.query('CREATE SCHEMA fukushu_upstream_test');
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		await db.query('CREATE TABLE drive_file (id varchar(32) PRIMARY KEY, name text NOT NULL DEFAULT \'fixture.gift\', "userId" varchar(32) REFERENCES "user"(id), "userHost" text, uri text, "isLink" boolean NOT NULL DEFAULT false, size integer NOT NULL, md5 text NOT NULL)');
		const runner = db.createQueryRunner();
		try { for (const Migration of [FukushuMaterial1794838800000, FukushuMaterialManagement1794871800000, FukushuQuestionVersions1794880800000, FukushuStudy1794891600000, FukushuUpstreamStore1794924000000, FukushuSourceChunks1794974400000, FukushuMaterialBytes1794980000000, FukushuDeckHistoryIndex1794990000000, FukushuReminder1795040000000, FukushuLearningSettings1795053600000, FukushuAnkiMedia1795305600000]) await new Migration().up(runner); } finally { await runner.release(); }
	});
	afterAll(async () => { if (db.isInitialized) { try { await db.query('DROP SCHEMA fukushu_upstream_test CASCADE'); } finally { await db.destroy(); } } });
	beforeEach(async () => { await db.query('TRUNCATE "user" CASCADE'); await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']); files.clear(); });

	async function upload(owner: string, content: Buffer = bytes) {
		const id = `file-${files.size}`; files.set(id, content);
		await db.query('INSERT INTO drive_file (id,"userId",size,md5) VALUES ($1,$2,$3,$4)', [id, owner, content.length, createHash('md5').update(content).digest('hex')]);
		return id;
	}

	function nativeApkgMaterial(deckId = 'imported-apkg', questionId = 'apkg-question') {
		const value = material(deckId, questionId);
		value.deck.sourceType = 'anki-apkg';
		value.deck.sourceHash = 'a'.repeat(64);
		return value;
	}

	test('commits native APKG cards and their receipt only once across concurrent delivery', async () => {
		const id = await upload('alice');
		await db.query('UPDATE drive_file SET name = $1 WHERE id = $2', ['original.apkg', id]);
		const identity = snapshot(bytes);
		const original = nativeApkgMaterial();
		const requestId = randomUUID();
		const save = () => new FukushuStore(db).createFromApkg('alice', id, requestId, { size: bytes.length, md5: identity.md5 }, original);
		await Promise.all([save(), save()]);
		const native = new FukushuStore(db);
		expect(await native.show('alice', original.deck.id)).toMatchObject(original);
		expect(await counts()).toEqual({ records: 0, receipts: 1 });
		expect(await native.list('bob')).toEqual([]);
		await expect(native.createFromApkg('alice', id, randomUUID(), { size: bytes.length, md5: identity.md5 }, nativeApkgMaterial('new-deck', 'new-card')))
			.rejects.toThrow('MATERIAL_EXISTS');
		await expect(native.createFromApkg('alice', 'different-file', requestId, { size: bytes.length, md5: identity.md5 }, original))
			.rejects.toThrow('MATERIAL_CONFLICT');
		expect(await native.list('alice')).toHaveLength(1);
	});

	test('rejects foreign and changed originals and rolls back cards and receipt on upstream collision', async () => {
		const apkgId = await upload('alice');
		await db.query('UPDATE drive_file SET name = $1 WHERE id = $2', ['original.apkg', apkgId]);
		const native = new FukushuStore(db);
		const requestId = randomUUID();
		const identity = { size: bytes.length, md5: snapshot(bytes).md5 };
		const deck = nativeApkgMaterial();
		await expect(native.createFromApkg('bob', apkgId, requestId, identity, deck)).rejects.toThrow('NO_SUCH_FILE');
		await expect(native.createFromApkg('alice', apkgId, requestId, { ...identity, size: 1 }, deck)).rejects.toThrow('IMPORT_FAILED');
		const key = createHash('sha256').update(JSON.stringify(deck.questions[0].id)).digest('hex');
		await db.query('INSERT INTO fukushu_upstream_record ("ownerId", store, key, data, position, "sourceHash") VALUES ($1, $2, $3, $4, $5, $6)',
			['alice', 'questions', key, '{}', 0, deck.deck.sourceHash]);
		await expect(native.createFromApkg('alice', apkgId, requestId, identity, deck)).rejects.toThrow('MATERIAL_EXISTS');
		expect(await native.list('alice')).toEqual([]);
		expect(await counts()).toEqual({ records: 1, receipts: 0 });
	});

	// Opt in after building backend so the test executes the production child entry.
	test.skipIf(!process.env.FUKUSHU_TEST_APKG_WORKER)('runs the real APKG worker, commits cards, and skips decoding on redelivery', async () => {
		const entry = pathToFileURL(resolve('built/fukushu-apkg-worker.js'));
		const archive = readFileSync('../features/games/fukushu/test/backend/fixtures/apkg/basic-21b.apkg');
		const fileId = await upload('alice', archive);
		const file = {
			id: fileId, userId: 'alice', userHost: null, uri: null, isLink: false,
			name: 'from-Anki.apkg', size: archive.length, md5: snapshot(archive).md5,
			storedInternal: true, accessKey: 'original',
		} as MiDriveFile;
		await db.query('UPDATE drive_file SET name = $1 WHERE id = $2', [file.name, fileId]);
		const read = vi.fn(() => Readable.from([archive]) as ReturnType<InternalStorageService['read']>);
		const native = new FukushuStore(db);
		const inspector = new FukushuBackupInspector({
			findOneBy: async where => !Array.isArray(where) && where.userId === 'alice' && where.id === fileId ? file : null,
		}, { read }, { downloadUrl: async () => { throw new Error('Must read the local original'); } }, new FukushuBackupStore(db));
		const job = { ownerId: 'alice', fileId, requestId: randomUUID(), format: 'anki-apkg' as const, ...await inspector.sourceIdentity('alice', fileId, 'anki-apkg') };
		const progress = vi.fn(async (_percent: number) => {});
		const run = () => processApkgJob(job, {
			restored: (owner, id, request) => store.restored(owner, id, request, 'anki-apkg'),
			withApkg: inspector.withApkg.bind(inspector),
			decode: source => decodeStagedApkg(source, entry),
			commit: native.createFromApkg.bind(native),
			progress,
		});
		await run();
		const [deck] = await native.list('alice');
		expect(deck).toMatchObject({ name: '取込テスト', questionCount: 2, sourceType: 'anki-apkg', sourceHash: await sha(archive) });
		expect((await native.show('alice', deck.id)).questions[0].payload.prompt.format).toBe('plain');
		expect(await native.list('bob')).toEqual([]);
		expect(await store.restored('alice', fileId, job.requestId, 'anki-apkg')).toBe(true);
		expect(await counts()).toEqual({ records: 0, receipts: 1 });
		expect(await db.query('SELECT name, size, md5 FROM drive_file WHERE id = $1', [fileId]))
			.toEqual([{ name: file.name, size: file.size, md5: file.md5 }]);
		await run();
		expect(read).toHaveBeenCalledTimes(1);
		expect(await native.list('alice')).toEqual([deck]);
		expect(await counts()).toEqual({ records: 0, receipts: 1 });
	});

	test('edits only the three owner settings and round trips old archives with unchanged media, cards, states and logs', async () => {
		const defaults = await store.settings('alice');
		expect(defaults).toEqual({ desiredRetention: 0.9, newQuestionsPerDay: 20, maxReviewsPerDay: null });
		const edited = { desiredRetention: 0.945, newQuestionsPerDay: 0, maxReviewsPerDay: 1000 };
		await store.updateSettings('alice', defaults, edited);
		expect(await store.settings('bob')).toEqual(defaults);
		// Native-only preferences do not create a source record or block the first backup restore.
		expect(await counts()).toEqual({ records: 0, receipts: 0 });
		const original = (await readUpstreamArchive(bytes, sha)).frames();
		await store.restore('alice', await upload('alice'), randomUUID());
		const imported = await store.settings('alice');
		expect(imported.desiredRetention).toBe(0.87);
		await expect(store.updateSettings('alice', defaults, edited)).rejects.toThrow('STUDY_CONFLICT');
		await store.updateSettings('alice', imported, edited);
		expect(await store.updateSettings('alice', imported, edited)).toEqual(edited);
		const archive = await exported(store, 'alice');
		const frames = (await readUpstreamArchive(archive, sha)).frames();
		expect(frames).toEqual(original.map(frame => frame.store === 'settings' ? { ...frame, value: { ...frame.value, ...edited } } : frame));
		await store.restore('bob', await upload('bob', archive), randomUUID());
		expect(await makeStore().settings('bob')).toEqual(edited);
		expect(await exported(store, 'bob')).toEqual(archive);
		const [budget] = await db.query('SELECT bytes, "materialBytes" FROM fukushu_source_usage WHERE "ownerId" = $1', ['alice']);
		expect((await db.query('SELECT bytes, "materialBytes" FROM fukushu_source_usage WHERE "ownerId" = $1', ['bob']))[0]).toEqual(budget);
	});

	test('refuses an over-budget settings change atomically and guards downgrade of saved preferences', async () => {
		const migration = new FukushuLearningSettings1795053600000();
		const runner = db.createQueryRunner();
		try {
			await migration.down(runner);
			await migration.up(runner);
			const initial = await store.settings('alice');
			await store.updateSettings('alice', initial, { ...initial, newQuestionsPerDay: 0 });
			await expect(migration.down(runner)).rejects.toThrow('must be preserved');
		} finally { await runner.release(); }
		await store.restore('alice', await upload('alice'), randomUUID());
		const settings = await store.settings('alice');
		const previous = await exported(store, 'alice');
		await db.query('UPDATE fukushu_source_usage SET "materialBytes" = $1 WHERE "ownerId" = $2', [8 * 1024 * 1024, 'alice']);
		await expect(store.updateSettings('alice', settings, { ...settings, desiredRetention: 0.87654321 })).rejects.toThrow('BACKUP_TOO_LARGE');
		expect(await store.settings('alice')).toEqual(settings);
		expect(await exported(store, 'alice')).toEqual(previous);
	});

	test('native preferences carry into the first GIFT, constrain today and protect concurrent edits', async () => {
		const defaults = await store.settings('alice');
		const off = { ...defaults, desiredRetention: 0.8, newQuestionsPerDay: 0 };
		await store.updateSettings('alice', defaults, off);
		await new FukushuStore(db).create('alice', material());
		const instant = new Date(expected.reset.request.reviewedAt).getTime();
		const day = { start: new Date(instant - 60_000).toISOString(), end: new Date(instant + 86_300_000).toISOString() };
		expect((await store.today('alice', day)).items).toEqual([]);
		const text = Buffer.from('::sample:: A question {TRUE}');
		const input = { requestId: randomUUID(), fileId: await upload('alice', text), name: 'New GIFT' };
		const { token } = await store.createGift('alice', input, async () => text);
		await store.createGift('alice', { ...input, confirmToken: token }, async () => text);
		expect((await store.show('alice')).records.settings[0]).toMatchObject(off);
		expect((await store.today('alice', day)).items).toEqual([]);
		const edits = await Promise.allSettled([0.81, 0.97].map(desiredRetention => store.updateSettings('alice', off, { ...off, desiredRetention })));
		expect(edits.filter(r => r.status === 'fulfilled')).toHaveLength(1);
		expect(edits.filter(r => r.status === 'rejected')).toMatchObject([{ reason: { code: 'STUDY_CONFLICT' } }]);
	});

	test('today combines owner queues once, orders due before fresh, and respects both 04:00 boundaries', async () => {
		const now = new Date('2026-11-19T04:00:00Z');
		const day = { start: '2026-11-19T04:00:00Z', end: '2026-11-20T04:00:00Z' };
		const source = new FukushuUpstreamStore(db, reader, () => now);
		const native = new FukushuStore(db);
		const study = new FukushuStudyStore(db, () => now);
		await native.create('alice', material('native', '000-native'));
		await native.create('bob', material('private', 'bob-only'));
		expect((await source.today('alice', day)).items).toEqual([{ origin: 'native', questionId: '000-native', deckId: 'native', version: 1, revision: 0, deckName: '教材' }]);
		const bytes = Buffer.from('::Q:: Q {TRUE}\n\n::R:: R {FALSE}');
		const input = { requestId: randomUUID(), fileId: await upload('alice', bytes), name: 'GIFT' };
		const read = async () => bytes;
		const { token } = await source.createGift('alice', input, read);
		await source.createGift('alice', { ...input, confirmToken: token }, read);
		const settings = async (fresh: number, reviews: number | null) => {
			const current = await source.settings('alice');
			await source.updateSettings('alice', current, { ...current, newQuestionsPerDay: fresh, maxReviewsPerDay: reviews });
		};
		await settings(1, 1);
		expect((await source.today('alice', day)).items).toHaveLength(1);
		await settings(3, 1);
		const plan = await source.today('alice', day);
		const first = plan.items.find(item => item.origin === 'source')!;
		expect(plan.items.map(item => item.origin).sort()).toEqual(['native', 'source', 'source']);
		expect((await source.today('bob', day)).items).toHaveLength(1);
		if (first.origin !== 'source') throw new Error('Expected a quiz');
		const nativeRequest = { id: 'native', questionId: '000-native', expectedStateRevision: 0, questionVersion: 1, requestId: randomUUID(), rating: 'good' as const, durationMs: 30 };
		const quizRequest = { questionId: first.question.id, expectedRevision: 0, requestId: randomUUID(), rating: 'good' as const, correct: true, answers: ['true'], durationMs: 30 };
		const saved = await study.review('alice', nativeRequest);
		expect(await study.review('alice', nativeRequest)).toEqual(saved);
		const quiz = await source.review('alice', quizRequest);
		expect(await source.review('alice', quizRequest)).toEqual(quiz);
		// Move beyond both due times, preserving actual recorded schedules and history.
		now.setTime(Math.max(Date.parse(saved.card.due), Date.parse(quiz.state.card.due)) + 1);
		const dueDay = { start: new Date(now.getTime() - 3600000).toISOString(), end: new Date(now.getTime() + 23 * 3600000).toISOString() };
		const limited = (await source.today('alice', dueDay)).items;
		expect(limited).toHaveLength(2);
		const earlier = Date.parse(saved.card.due) <= Date.parse(quiz.state.card.due) ? 'native' : 'source';
		expect(limited[0]).toMatchObject({ origin: earlier, revision: 1 });
		expect(limited[1].revision).toBe(0);
		await settings(0, null);
		expect((await source.today('alice', dueDay)).items.map(i => i.revision)).toEqual([1, 1]);
		await native.archive('alice', 'native', 1, true);
		expect((await source.today('alice', dueDay)).items.map(i => i.origin)).toEqual(['source']);
		// Incompatible GIFT update resets its state and retains the original review.
		now.setTime(Date.parse('2026-11-19T04:00:00Z'));
		const changed = Buffer.from('::Q:: Q {FALSE}\n\n::R:: R {TRUE}');
		const changedFile = await upload('alice', changed);
		const preview = await source.updateGift('alice', input.requestId, changedFile, async () => changed);
		await source.updateGift('alice', input.requestId, changedFile, async () => changed, preview.token);
		await settings(3, null);
		const ids = async (window: typeof day) => (await source.today('alice', window)).items.flatMap(i => i.origin === 'source' ? [i.question.id] : []);
		const time = now.getTime();
		await expect(ids({ start: now.toISOString(), end: new Date(time + 86400000).toISOString() })).resolves.not.toContain(first.question.id);
		now.setTime(time - 1);
		await expect(ids({ start: new Date(time - 86400000).toISOString(), end: new Date(time).toISOString() })).resolves.toContain(first.question.id);
		await expect(source.today('alice', { start: day.end, end: day.start })).rejects.toThrow('INVALID_MATERIAL');
	});

	test('practice ahead includes both families, retains native v1 history and still requires the owner and current revision', async () => {
		const now = new Date('2026-11-19T08:00:00Z');
		const day = { start: '2026-11-19T04:00:00Z', end: '2026-11-20T04:00:00Z' };
		const source = new FukushuUpstreamStore(db, reader, () => now);
		const native = new FukushuStore(db);
		const study = new FukushuStudyStore(db, () => now);
		await native.create('alice', material());
		const input = { id: 'deck-original', questionId: 'card-original', requestId: randomUUID(), questionVersion: 1, expectedStateRevision: 0, rating: 'good' as const, durationMs: 500 };
		await study.review('alice', input);
		expect((await study.queue('alice', input.id)).items).toEqual([]);
		expect((await source.today('alice', day)).items).toEqual([]);
		expect((await source.today('alice', { ...day, practiceAhead: true })).items[0]).toMatchObject({ origin: 'native', revision: 1 });
		const retry = { ...input, requestId: randomUUID(), expectedStateRevision: 1 };
		await expect(study.review('alice', retry)).rejects.toThrow('STUDY_UNAVAILABLE');
		const practice = { ...retry, practiceAhead: true as const };
		await expect(study.review('bob', practice)).rejects.toThrow('NO_SUCH_MATERIAL');
		const response = await study.review('alice', practice);
		expect(await study.review('alice', practice)).toEqual(response);
		await expect(study.review('alice', { ...practice, requestId: randomUUID() })).rejects.toThrow('STUDY_CONFLICT');
		expect((await study.history('alice', input.id))).toHaveLength(2);
		expect((await new FukushuBackupStore(db, () => now).export('alice', input.id)).length).toBeGreaterThan(0);
	});

	test('checks native due reviews only for their opted-in owner and claims once across workers and restarts', async () => {
		let now = new Date('2026-11-18T00:00:00Z');
		const worker = () => new FukushuReminderStore(db, () => now);
		const native = new FukushuStore(db);
		const study = new FukushuStudyStore(db, () => now);
		await native.create('alice', material());
		await native.create('bob', material());
		await study.review('alice', {
			id: 'deck-original', questionId: 'card-original', questionVersion: 1,
			expectedStateRevision: 0, requestId: randomUUID(), rating: 'again', durationMs: 100,
		});
		const schedule = { localTime: '09:05', zone: 'Asia/Tokyo' };
		expect(await worker().claimNext()).toBeUndefined();
		await worker().configure('bob', schedule);
		await worker().configure('alice', schedule);
		expect(await worker().claimNext()).toBeUndefined();
		now = new Date('2026-11-18T00:05:00Z');
		const claims = await Promise.all([worker().claimNext(), worker().claimNext()]);
		expect(claims.sort()).toEqual(['alice', null]);
		expect(await worker().claimNext()).toBeUndefined();
		await worker().configure('alice', null);
		await worker().configure('alice', { localTime: '10:00', zone: 'Asia/Tokyo' });
		now = new Date('2026-11-18T01:00:00Z');
		expect(await worker().claimNext()).toBeNull();
		await db.query('UPDATE fukushu_deck SET "archivedAt" = $1 WHERE "ownerId" = $2', [now, 'alice']);
		now = new Date('2026-11-19T01:00:00Z');
		expect(await worker().claimNext()).toBeNull(); // Bob's fresh card
		expect(await worker().claimNext()).toBeNull(); // Alice's archived deck
		await worker().configure('alice', null);
		await worker().configure('bob', null);
		now = new Date('2026-11-20T01:00:00Z');
		expect(await worker().claimNext()).toBeUndefined();
	});

	test('checks imported state and eligible questions, tolerates opaque source text and leaves history intact', async () => {
		let now = new Date('2027-12-01T08:00:00Z');
		const pilot = new FukushuReminderStore(db, () => now);
		await store.restore('alice', await upload('alice'), randomUUID());
		const original = await exported(store, 'alice');
		const schedule = { localTime: '08:00', zone: 'UTC' };
		await pilot.configure('bob', schedule);
		expect(await pilot.claimNext()).toBeNull();
		await pilot.configure('alice', schedule);
		expect(await pilot.claimNext()).toBe('alice');
		expect(await exported(store, 'alice')).toEqual(original);
		const states = await db.query<{ key: string }[]>('SELECT key FROM fukushu_upstream_record WHERE store = $1', ['studyStates']);
		await db.query('UPDATE fukushu_upstream_record SET data = $1 WHERE store = $2', [JSON.stringify({ suspended: false, card: { reps: 0, due: now } }), 'studyStates']);
		const nextDay = async () => {
			now = new Date(now.getTime() + 86400_000);
			return pilot.claimNext();
		};
		// Bob opts out so his empty schedule can't affect subsequent assertions.
		await pilot.configure('bob', null);
		expect(await nextDay()).toBeNull();
		const key = states[0].key;
		const write = async (storeName: string, value: unknown) => db.query(
			'UPDATE fukushu_upstream_record SET data = $1 WHERE store = $2 AND key = $3', [JSON.stringify(value), storeName, key]);
		const due = { reps: 1, due: now };
		await write('studyStates', { suspended: true, card: due });
		expect(await nextDay()).toBeNull();
		await write('studyStates', { suspended: false, card: { reps: 1, due: '2099-01-01T00:00:00Z' } });
		expect(await nextDay()).toBeNull();
		await write('studyStates', { suspended: false, card: due });
		await write('questions', { enabled: false, kind: 'flashcard' });
		expect(await nextDay()).toBeNull();
		await write('questions', { enabled: true, kind: 'unsupported' });
		expect(await nextDay()).toBeNull();
		await write('questions', { enabled: true, kind: 'flashcard', text: 'a\0b' });
		expect(await nextDay()).toBe('alice');
	});

	test('uses the configured civil time through DST and bounds catch-up after downtime', async () => {
		let now = new Date('2026-03-07T12:00:00Z');
		const pilot = new FukushuReminderStore(db, () => now);
		const saved = async (): Promise<Date> => (await db.query('SELECT "nextAt" FROM fukushu_reminder'))[0].nextAt;
		await expect(pilot.configure('alice', { localTime: '24:00', zone: 'UTC' })).rejects.toThrow();
		await expect(pilot.configure('alice', { localTime: '08:00', zone: 'Unknown/Zone' })).rejects.toThrow();
		await pilot.configure('alice', { localTime: '02:30', zone: 'America/New_York' });
		expect(await saved()).toEqual(new Date('2026-03-08T07:30:00Z')); // gap moves forward to 03:30
		now = await saved();
		expect(await pilot.claimNext()).toBeNull();
		expect(await saved()).toEqual(new Date('2026-03-09T06:30:00Z'));
		now = new Date('2026-10-31T12:00:00Z');
		await pilot.configure('alice', { localTime: '01:30', zone: 'America/New_York' });
		expect(await saved()).toEqual(new Date('2026-11-01T06:30:00Z')); // later occurrence
		await store.restore('alice', await upload('alice'), randomUUID());
		now = new Date('2027-12-01T07:30:00Z'); // exactly one hour late, no catch-up
		expect(await pilot.claimNext()).toBeNull();
		expect(await saved()).toEqual(new Date('2027-12-02T06:30:00Z'));
		now = new Date('2027-12-03T07:29:59Z'); // latest eligible day only
		expect(await pilot.claimNext()).toBe('alice');
		expect(await pilot.claimNext()).toBeUndefined();
	});
	test('rolls back a failed claim and preserves the claimed calendar day when the owner moves west', async () => {
		let now = new Date('2027-12-01T23:00:00Z');
		const pilot = new FukushuReminderStore(db, () => now);
		await store.restore('alice', await upload('alice'), randomUUID());
		await pilot.configure('alice', { localTime: '08:00', zone: 'Asia/Tokyo' });
		await db.query('ALTER TABLE fukushu_reminder ADD CONSTRAINT fail_claim CHECK ("lastClaimedAt" IS NULL)');
		try {
			await expect(pilot.claimNext()).rejects.toThrow(/fail_claim/);
		} finally {
			await db.query('ALTER TABLE fukushu_reminder DROP CONSTRAINT fail_claim');
		}
		expect(await pilot.claimNext()).toBe('alice'); // December 2 in Tokyo
		await pilot.configure('alice', { localTime: '00:01', zone: 'UTC' });
		now = new Date('2027-12-02T00:01:00Z');
		expect(await pilot.claimNext()).toBeNull(); // still December 2, even in the new zone
		now = new Date('2027-12-03T00:01:00Z');
		expect(await pilot.claimNext()).toBe('alice');
	});
	test('resumes committed claims, retries a leased send with one occurrence, and cancels before retry on opt-out', async () => {
		let now = new Date('2027-12-01T08:00:00Z');
		const worker = () => new FukushuReminderStore(db, () => now);
		const schedule = { localTime: '08:00', zone: 'UTC' };
		await store.restore('alice', await upload('alice'), randomUUID());
		await worker().configure('alice', schedule);
		expect(await worker().settings('alice')).toEqual(schedule);
		expect(await worker().settings('bob')).toBeNull();
		expect(await worker().claimNext()).toBe('alice');
		// The process that claimed the schedule stops before dispatch.
		const occurrence = now.getTime();
		const body = { occurrence, expiresAt: occurrence + 3600_000 };
		const send = vi.fn(async (_owner: string, _body: typeof body) => true);
		send.mockRejectedValueOnce(new Error('process stopped before acknowledgement'));
		await expect(worker().deliverNext(send)).rejects.toThrow('before acknowledgement');
		expect(send).toHaveBeenCalledWith('alice', body);
		expect(await worker().deliverNext(send)).toBe(false);
		now = new Date(occurrence + 5 * 60_000);
		const results = await Promise.all([worker().deliverNext(send), worker().deliverNext(send)]);
		expect(results.sort()).toEqual([false, true]);
		expect(send.mock.calls).toEqual([['alice', body], ['alice', body]]);
		expect(await worker().deliverNext(send)).toBe(false);

		now = new Date('2027-12-02T08:00:00Z');
		expect(await worker().claimNext()).toBe('alice');
		send.mockResolvedValueOnce(false);
		expect(await worker().deliverNext(send)).toBe(true);
		await worker().configure('alice', null);
		now = new Date(now.getTime() + 5 * 60_000);
		expect(await worker().deliverNext(send)).toBe(false);
		expect(await worker().settings('alice')).toBeNull();
		expect(send).toHaveBeenCalledTimes(3);
	});

	test('discards expired delivery and rechecks cards studied or suspended before dispatch', async () => {
		let now = new Date('2027-12-01T08:00:00Z');
		const worker = new FukushuReminderStore(db, () => now);
		const send = vi.fn(async () => true);
		await store.restore('alice', await upload('alice'), randomUUID());
		await worker.configure('alice', { localTime: '08:00', zone: 'UTC' });
		expect(await worker.claimNext()).toBe('alice');
		now = new Date('2027-12-01T09:00:00Z');
		expect(await worker.deliverNext(send)).toBe(true);
		now = new Date('2027-12-02T08:00:00Z');
		expect(await worker.claimNext()).toBe('alice');
		await db.query('UPDATE fukushu_upstream_record SET data = $1 WHERE store = $2', [JSON.stringify({ suspended: true }), 'studyStates']);
		expect(await worker.deliverNext(send)).toBe(true);
		expect(await worker.deliverNext(send)).toBe(false);
		expect(send).not.toHaveBeenCalled();
	});
	test('retains original records, reset history and binary across persistent export and resumed review', async () => {
		const original = await readUpstreamArchive(bytes, sha);
		await store.restore('alice', await upload('alice'), randomUUID());
		expect((await makeStore().show('alice')).records).toEqual(original.normalizedRecords());
		expect((await readUpstreamArchive(await exported(makeStore(), 'alice'), sha)).frames()).toEqual(original.frames());
		const { reviewedAt: _time, ...request } = expected.reset.request;
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
		const output = await readUpstreamArchive(await exported(store, 'alice'), sha);
		expect(output.normalizedRecords().reviewLogs).toHaveLength(38);
		expect(output.frames().filter(f => f.blob !== undefined)).toEqual(original.frames().filter(f => f.blob !== undefined));
		expect(await counts()).toMatchObject({ receipts: 2 });
	});

	test('owner isolation and identical source IDs for different owners', async () => {
		const file = await upload('alice'); const request = randomUUID();
		await store.restore('alice', file, request);
		await expect(store.show('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(exported(store, 'bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(store.restore('bob', file, request)).rejects.toThrow('NO_SUCH_FILE');
		await store.restore('bob', await upload('bob'), randomUUID());
		expect(await store.show('alice')).toEqual(await store.show('bob'));
	});

	test('creates a GIFT collection atomically and replays the confirmed creation', async () => {
		const source = '$CATEGORY: Biology\n\n::leaf:: Leaves absorb light. {TRUE}';
		const bytes = Buffer.from(source);
		const fileId = await upload('alice', bytes);
		const input = { fileId, name: 'Biology', requestId: randomUUID() };
		const read = async () => bytes;
		const preview = await store.createGift('alice', input, read);
		expect(preview).toMatchObject({ applied: false, added: 1 });
		expect(await counts()).toEqual({ records: 0, receipts: 0 });
		const confirmed = { ...input, confirmToken: preview.token };
		await expect(store.createGift('bob', confirmed, read)).rejects.toThrow();
		await expect(store.createGift('alice', { ...confirmed, name: 'Other' }, read)).rejects.toThrow('STUDY_CONFLICT');
		await db.query("CREATE FUNCTION fail_gift() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'receipt rollback'; END $$");
		await db.query('CREATE TRIGGER reject_gift BEFORE INSERT ON fukushu_operation_receipt FOR EACH ROW EXECUTE FUNCTION fail_gift()');
		try {
			await expect(store.createGift('alice', confirmed, read)).rejects.toThrow('receipt rollback');
			expect(await counts()).toEqual({ records: 0, receipts: 0 });
			expect(await db.query('SELECT 1 FROM fukushu_source_usage')).toEqual([]);
		} finally { await db.query('DROP TRIGGER reject_gift ON fukushu_operation_receipt'); await db.query('DROP FUNCTION fail_gift()'); }
		const [applied, replay] = await Promise.all([store.createGift('alice', confirmed, read), store.createGift('alice', confirmed, read)]);
		expect(applied.applied).toBe(true); expect(replay).toEqual(applied);
		const records = (await store.show('alice')).records;
		expect(records.settings).toHaveLength(1);
		expect(records.decks).toHaveLength(1);
		expect(records.decks[0]).toMatchObject({ id: input.requestId, name: input.name, sourceFileName: 'fixture.gift', sourceText: source });
		expect(records.importSources[0]).toMatchObject({ id: records.decks[0].sourceId, sourceText: source, sourceHash: records.decks[0].sourceHash });
		expect(records.questions[0].payload.categoryPath).toEqual(['Biology']);
		expect(records.studyStates[0].card.reps).toBe(0);
		await expect(store.createGift('alice', confirmed, async () => { throw new Error('lost original'); })).resolves.toEqual(applied);
		await expect(store.show('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
	});

	test('appends a separate GIFT deck without replacing existing source frames, user settings or review history', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await exported(store, 'alice');
		const { reviewedAt: _at, ...review } = expected.reset.request;
		const source = Buffer.from('::same title:: A new question. {TRUE}');
		const input = { fileId: await upload('alice', source), requestId: randomUUID(), name: 'Compatibility reset example' };
		const preview = await store.createGift('alice', input, async () => source);
		await store.review('alice', review);
		const reviewed = await exported(store, 'alice');
		expect(reviewed).not.toEqual(before);
		await store.createGift('alice', { ...input, confirmToken: preview.token }, async () => source);
		const after = await exported(store, 'alice');
		expect(after.subarray(0, reviewed.length - 64).equals(reviewed.subarray(0, -64))).toBe(true);
		const absent = Buffer.from('// just a comment');
		const invalid = { ...input, fileId: await upload('alice', absent), requestId: randomUUID() };
		await expect(store.createGift('alice', invalid, async () => absent)).rejects.toThrow('INVALID_BACKUP');
		expect(await exported(store, 'alice')).toEqual(after);
	});

	test('serves owned media and atomically updates a GIFT deck without rewriting history or APKG data', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const { reviewedAt: _time, ...request } = expected.reset.request;
		await store.review('alice', request);
		const before = await readUpstreamArchive(await exported(store, 'alice'), sha);
		const records = before.normalizedRecords();
		const deck = records.decks.find(d => d.sourceType === 'gift')!;
		const original = records.questions.find(q => q.deckId === deck.id)!;
		for (const medium of before.frames().filter(f => f.store === 'media')) {
			const result = await store.media('alice', String(medium.value.id));
			expect(result.mimeType).toBe(medium.value.mimeType);
			expect(Buffer.from(result.base64, 'base64')).toEqual(Buffer.from(medium.blob!));
			await expect(store.media('bob', String(medium.value.id))).rejects.toThrow('NO_SUCH_MATERIAL');
		}
		const bytes = Buffer.from('::stable-name:: Sky is blue. {TRUE}\n\n::added:: New question. {FALSE}');
		const file = await upload('alice', bytes);
		const preview = () => store.updateGift('alice', deck.id, file, async () => bytes);
		const apply = (token: string) => store.updateGift('alice', deck.id, file, async () => bytes, token);
		const plan = await preview();
		expect(plan).toMatchObject({ added: 1, changed: 1, disabled: 0, reset: 1, applied: false });
		expect(await exported(store, 'alice')).toEqual(Buffer.from(before.originalBytes()));
		await expect(store.updateGift('alice', deck.id, await upload('bob', bytes), async () => bytes)).rejects.toThrow('BACKUP_FAILED');
		expect(await apply(plan.token)).toMatchObject({ applied: true });
		await expect(apply(plan.token)).rejects.toThrow('STUDY_CONFLICT');
		const after = await readUpstreamArchive(await exported(store, 'alice'), sha);
		expect(after.normalizedRecords().questions.find(q => q.id === original.id)?.payload).toMatchObject({ correctAnswer: true });
		expect(after.normalizedRecords().studyStates.find(q => q.questionId === original.id)?.card.reps).toBe(0);
		expect(after.normalizedRecords().reviewLogs).toEqual(records.reviewLogs);
		expect(after.frames().filter(f => f.blob !== undefined)).toEqual(before.frames().filter(f => f.blob !== undefined));
		expect(after.normalizedRecords().imports.at(-1)).toMatchObject({ added: 1, changed: 1 });
		const second = await preview();
		expect(second).toMatchObject({ reset: 0, changed: 0, added: 0 });
	});

	test('a later review invalidates a GIFT preview; disabling a missing card retains its last schedule and all logs', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = (await store.show('alice')).records;
		const deck = before.decks.find(d => d.sourceType === 'gift')!;
		const question = before.questions.find(q => q.deckId === deck.id)!;
		const bytes = Buffer.from('::other:: Rain is wet. {TRUE}');
		const file = await upload('alice', bytes);
		const update = (token?: string) => store.updateGift('alice', deck.id, file, async () => bytes, token);
		const preview = await update();
		expect(preview).toMatchObject({ added: 1, disabled: 1, reset: 0 });
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const reviewed = await store.review('alice', request);
		await expect(update(preview.token)).rejects.toThrow('STUDY_CONFLICT');
		const current = await update();
		const baseline = await exported(store, 'alice');
		await db.query('CREATE FUNCTION fail_gift_import() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'injected update rollback\'; END $$');
		await db.query('CREATE TRIGGER fail_gift BEFORE INSERT ON fukushu_upstream_record FOR EACH ROW WHEN (NEW.store = \'imports\') EXECUTE FUNCTION fail_gift_import()');
		try {
			await expect(update(current.token)).rejects.toThrow('injected update rollback');
			expect(await exported(store, 'alice')).toEqual(baseline);
		} finally {
			await db.query('DROP TRIGGER fail_gift ON fukushu_upstream_record');
			await db.query('DROP FUNCTION fail_gift_import()');
		}
		await update(current.token);
		const after = (await store.show('alice')).records;
		expect(after.questions.find(q => q.id === question.id)).toMatchObject({ enabled: false });
		expect(after.studyStates.find(q => q.questionId === question.id)).toMatchObject({ suspended: true, card: reviewed.state.card });
		expect(after.reviewLogs).toContainEqual(reviewed.record);
	});

	test('concurrent import retry commits once, receipt survives a new service and changed requests conflict', async () => {
		const file = await upload('alice'); const id = randomUUID();
		const result = await Promise.all([store.restore('alice', file, id), store.restore('alice', file, id)]);
		expect(result[0]).toEqual(result[1]);
		await db.query('DELETE FROM drive_file');
		expect(await makeStore().restore('alice', file, id)).toEqual(result[0]);
		await expect(store.restore('alice', 'different-file', id)).rejects.toThrow('STUDY_CONFLICT');
		expect((await counts()).receipts).toBe(1);
	});

	test('different operation on existing IDs is rejected atomically', async () => {
		const file = await upload('alice'); await store.restore('alice', file, randomUUID());
		const before = await exported(store, 'alice'); const totals = await counts();
		await expect(store.restore('alice', file, randomUUID())).rejects.toThrow('BACKUP_CONFLICT');
		expect(await exported(store, 'alice')).toEqual(before); expect(await counts()).toEqual(totals);
	});

	test('native collisions are rejected in both directions', async () => {
		const original = (await readUpstreamArchive(bytes, sha)).normalizedRecords();
		await new FukushuStore(db).create('alice', material(original.decks[0].id, 'native-card'));
		await expect(store.restore('alice', await upload('alice'), randomUUID())).rejects.toThrow('BACKUP_CONFLICT');
		expect(await counts()).toEqual({ records: 0, receipts: 0 });
		await store.restore('bob', await upload('bob'), randomUUID());
		await expect(new FukushuStore(db).create('bob', material(original.decks[0].id, 'other-card'))).rejects.toThrow();
		expect(await db.query('SELECT 1 FROM fukushu_deck WHERE "ownerId" = $1', ['bob'])).toHaveLength(0);
	});

	test('late receipt insert failure rolls back every source record and binary', async () => {
		await db.query('CREATE FUNCTION fail_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'injected rollback\'; END $$');
		await db.query('CREATE TRIGGER injected BEFORE INSERT ON fukushu_operation_receipt FOR EACH ROW EXECUTE FUNCTION fail_receipt()');
		try { await expect(store.restore('alice', await upload('alice'), randomUUID())).rejects.toThrow('injected rollback'); expect(await counts()).toEqual({ records: 0, receipts: 0 }); } finally { await db.query('DROP TRIGGER injected ON fukushu_operation_receipt'); await db.query('DROP FUNCTION fail_receipt()'); }
	});

	test('concurrent review retry and stale revisions never double advance', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const results = await Promise.all([store.review('alice', request), store.review('alice', request)]);
		expect(results[0]).toEqual(results[1]);
		await expect(store.review('alice', { ...request, rating: 'hard' })).rejects.toThrow('STUDY_CONFLICT');
		await expect(store.review('alice', { ...request, requestId: randomUUID() })).rejects.toThrow('STUDY_CONFLICT');
		expect((await store.show('alice')).records.reviewLogs).toHaveLength(38);
	});

	test('Drive ownership or bytes changing after the read rejects the complete import', async () => {
		for (const change of ['owner', 'bytes']) {
			const file = await upload('alice');
			const raced = new FukushuUpstreamStore(db, { withSource: async (_owner, _id, use) => {
				await db.query(change === 'owner' ? 'UPDATE drive_file SET "userId" = $1 WHERE id = $2' : 'UPDATE drive_file SET md5 = $1 WHERE id = $2', [change === 'owner' ? 'bob' : 'changed', file]);
				return use(snapshot(bytes));
			} });
			await expect(raced.restore('alice', file, randomUUID())).rejects.toThrow(change === 'owner' ? 'NO_SUCH_FILE' : 'BACKUP_FAILED');
			expect(await counts()).toEqual({ records: 0, receipts: 0 });
		}
	});

	test('late review receipt failure restores the previous schedule and log set, then permits a retry', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await exported(store, 'alice'); const totals = await counts();
		const { reviewedAt: _time, ...request } = expected.reset.request;
		await db.query('CREATE FUNCTION fail_review_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'injected review rollback\'; END $$');
		await db.query('CREATE TRIGGER injected BEFORE INSERT ON fukushu_operation_receipt FOR EACH ROW EXECUTE FUNCTION fail_review_receipt()');
		try {
			await expect(store.review('alice', request)).rejects.toThrow('injected review rollback');
			expect(await exported(store, 'alice')).toEqual(before); expect(await counts()).toEqual(totals);
		} finally { await db.query('DROP TRIGGER injected ON fukushu_operation_receipt'); await db.query('DROP FUNCTION fail_review_receipt()'); }
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
	});

	test('synthetic non-UUID/control/surrogate IDs survive PostgreSQL without jsonb rewriting', async () => {
		const frames = (await readUpstreamArchive(bytes, sha)).frames();
		const log = frames.find(row => row.store === 'reviewLogs')!; log.value.id = 'anki:control\u0000\ud800';
		const input = Buffer.from((await encodeUpstreamFrames(frames)).originalBytes());
		await store.restore('alice', await upload('alice', input), randomUUID());
		expect((await readUpstreamArchive(await exported(store, 'alice'), sha)).frames()).toEqual(frames);
	});

	test('large attachment, atomic rollback, stable source and concurrent reviews', async () => {
		const media = Buffer.alloc(9 * 1024 * 1024 + 13, 42);
		const mediaId = createHash('sha256').update(media).digest('hex');
		const frame = Buffer.from(JSON.stringify({ store: 'media', value: { id: mediaId, size: media.length, blobBase64: '', mimeType: 'application/octet-stream' }, blobSize: media.length }));
		const prefix = Buffer.alloc(4); prefix.writeUInt32LE(frame.length);
		const payload = Buffer.concat([bytes.subarray(0, -64), prefix, frame, media]);
		const collection = Buffer.concat([payload, Buffer.from(createHash('sha256').update(payload).digest('hex'))]);
		const fileId = await upload('alice', collection);
		const input = { size: collection.length, md5: snapshot(collection).md5 };
		const requestId = randomUUID();
		await expect(store.restore('alice', fileId, requestId)).rejects.toThrow('BACKUP_TOO_LARGE');
		await expect(store.restore('alice', fileId, requestId, { ...input, md5: 'changed' })).rejects.toThrow('BACKUP_FAILED');
		await db.query('CREATE FUNCTION fail_chunk() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.part > 2 THEN RAISE EXCEPTION \'late chunk rollback\'; END IF; RETURN NEW; END $$');
		await db.query('CREATE TRIGGER injected BEFORE INSERT ON fukushu_upstream_chunk FOR EACH ROW EXECUTE FUNCTION fail_chunk()');
		try {
			await expect(store.restore('alice', fileId, requestId, input)).rejects.toThrow('late chunk rollback');
			expect(await counts()).toEqual({ records: 0, receipts: 0 });
			expect(await db.query('SELECT 1 FROM fukushu_upstream_chunk UNION ALL SELECT 1 FROM fukushu_source_usage')).toEqual([]);
		} finally { await db.query('DROP TRIGGER injected ON fukushu_upstream_chunk'); await db.query('DROP FUNCTION fail_chunk()'); }
		const results = await Promise.all([store.restore('alice', fileId, requestId, input), store.restore('alice', fileId, requestId, input)]);
		expect(results[0]).toEqual(results[1]);
		await expect(store.restore('alice', fileId, randomUUID(), input)).rejects.toThrow('BACKUP_CONFLICT');
		await expect(store.show('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const attempts = await Promise.allSettled([store.review('alice', request), store.review('alice', { ...request, requestId: randomUUID() })]);
		expect(attempts.filter(a => a.status === 'fulfilled')).toHaveLength(1);
		const parts: Uint8Array<ArrayBuffer>[] = [];
		await store.writeExport('alice', async part => { expect(part.length).toBeLessThanOrEqual(256 * 1024); parts.push(new Uint8Array(part)); });
		const inspected = await scanSourceArchive(new Blob(parts));
		expect(inspected.counts.reviewLogs).toBe(38);
		expect(inspected.binaryBytes).toBe((await readUpstreamArchive(bytes, sha)).binaryBytes + media.length);
		const [usage] = await db.query('SELECT count, logs, bytes, binaries FROM fukushu_source_usage');
		expect(usage.logs).toBe(38);
		expect(usage.binaries + usage.bytes + 4 * usage.count + 81).toBe(new Blob(parts).size);
		const start = 256 * 1024 - 3;
		const chunked = await store.media('alice', mediaId, start);
		expect(chunked.totalBytes).toBe(media.length);
		const mediaKey = createHash('sha256').update(JSON.stringify(mediaId)).digest('hex');
		await db.query('DELETE FROM fukushu_upstream_chunk WHERE "ownerId" = $1 AND store = $2 AND key = $3 AND part = 1', ['alice', 'media', mediaKey]);
		await expect(store.media('alice', mediaId, start)).rejects.toThrow('BACKUP_FAILED');
		// The same logical media must read identically from a single large bytea.
		await db.query('UPDATE fukushu_upstream_record SET blob = $4, "chunkedSize" = NULL WHERE "ownerId" = $1 AND store = $2 AND key = $3', ['alice', 'media', mediaKey, media]);
		expect(await store.media('alice', mediaId, start)).toEqual(chunked);
		await expect(store.media('bob', mediaId, start)).rejects.toThrow('NO_SUCH_MATERIAL');
	});

	test('ordinary reviews cross both legacy record ceilings, replay once and round-trip every frame', async () => {
		const original = (await readUpstreamArchive(bytes, sha)).frames();
		const log = original.find(frame => frame.store === 'reviewLogs');
		const imported = original.find(frame => frame.store === 'imports');
		if (!log || !imported) throw new Error('Expected source review and import fixtures');
		const parts = [bytes.subarray(0, -64)];
		let total = original.length;

		function append(template: (typeof original)[number], id: string) {
			const json = Buffer.from(JSON.stringify({ store: template.store, value: { ...template.value, id } }));
			const length = Buffer.alloc(4);
			length.writeUInt32LE(json.length);
			parts.push(length, json);
			total++;
		}

		for (let n = original.filter(frame => frame.store === 'reviewLogs').length; n < 9999; n++) append(log, 'log-' + n);
		while (total < 20_000) append(imported, 'import-' + total);
		const payload = Buffer.concat(parts);
		const input = Buffer.concat([payload, Buffer.from(await sha(payload))]);
		expect(input.length).toBeLessThan(8 * 1024 * 1024);
		expect((await store.restore('alice', await upload('alice', input), randomUUID())).records).toBe(20_000);
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const first = await store.review('alice', request);
		const next = { ...request, requestId: randomUUID(), expectedRevision: 1 };
		const [second, replay] = await Promise.all([store.review('alice', next), store.review('alice', next)]);
		expect(first.revision).toBe(1);
		expect(second.revision).toBe(2);
		expect(replay).toEqual(second);
		const output = await exported(store, 'alice');
		const dir = await mkdtemp(join(tmpdir(), 'fukushu-long-history-'));
		try {
			const path = join(dir, 'boundary.fukushu');
			await writeFile(path, output);
			expect(await isFukushuBackupFile(path)).toBe(true);
		} finally { await rm(dir, { recursive: true, force: true }); }
		const inspection = await scanSourceArchive(new Blob([new Uint8Array(output)]));
		expect(inspection.counts.reviewLogs).toBe(10_001);
		expect((await readUpstreamArchive(output, sha)).normalizedRecords().reviewLogs).toHaveLength(10_001);
		await expect(store.show('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		expect((await store.restore('bob', await upload('bob', output), randomUUID())).records).toBe(20_002);
		expect(await sha(await exported(store, 'bob'))).toBe(await sha(output));
	}, 60_000);

	test('a review crossing the old aggregate byte budget preserves the original history', async () => {
		const frames = (await readUpstreamArchive(bytes, sha)).frames();
		const log = frames.find(frame => frame.store === 'reviewLogs');
		if (!log) throw new Error('Expected a source review fixture');
		const record = { store: log.store, value: { ...log.value, id: 'padded-history', responseText: '' } };
		const metadataBytes = frames.reduce((sum, frame) => sum + Buffer.byteLength(JSON.stringify({
			store: frame.store,
			value: frame.value,
			...(frame.blob === undefined ? {} : { blobSize: frame.blob.length }),
		})), 0);
		record.value.responseText = 'a'.repeat(8 * 1024 * 1024 - metadataBytes - Buffer.byteLength(JSON.stringify(record)) - 1);
		const json = Buffer.from(JSON.stringify(record));
		const header = Buffer.alloc(4); header.writeUInt32LE(json.length);
		const payload = Buffer.concat([bytes.subarray(0, -64), header, json]);
		const input = Buffer.concat([payload, Buffer.from(await sha(payload))]);
		const fileId = await upload('alice', input);
		await store.restore('alice', fileId, randomUUID(), { size: input.length, md5: snapshot(input).md5 });
		const { reviewedAt: _time, ...request } = expected.reset.request;
		expect((await store.review('alice', request)).revision).toBe(1);
		const output = await exported(store, 'alice');
		const inspected = await scanSourceArchive(new Blob([new Uint8Array(output)]));
		expect(inspected.counts.reviewLogs).toBe(frames.filter(row => row.store === 'reviewLogs').length + 2);
		expect(output.includes(json)).toBe(true);
	});

	test('pages and edits GIFT above 8 MiB of history without fetching unrelated review bodies', async () => {
		const original = (await readUpstreamArchive(bytes, sha)).frames();
		const sample = original.find(frame => frame.store === 'reviewLogs');
		if (!sample) throw new Error('Expected a review log');
		const pieces = [bytes.subarray(0, 17)];
		for (let i = 0; i < 2200; i++) {
			const value = { ...sample.value, id: 'synthetic:' + i, responseText: 'x'.repeat(4096) };
			const json = Buffer.from(JSON.stringify({ store: 'reviewLogs', value }));
			const prefix = Buffer.alloc(4);
			prefix.writeUInt32LE(json.length);
			pieces.push(prefix, json);
		}
		// References can precede their deck and question in a source archive.
		pieces.push(bytes.subarray(17, -64));
		const payload = Buffer.concat(pieces);
		const input = Buffer.concat([payload, Buffer.from(await sha(payload))]);
		expect(input.length).toBeGreaterThan(8 * 1024 * 1024);

		async function restore(owner: string, input: Buffer) {
			const file = await upload(owner, input);
			const request = randomUUID();
			const accepted = { size: input.length, md5: snapshot(input).md5 };
			const result = await store.restore(owner, file, request, accepted);
			expect(await store.restore(owner, file, request, accepted)).toEqual(result);
		}

		await restore('alice', input);
		await expect(store.show('alice')).rejects.toThrow('BACKUP_TOO_LARGE');
		expect((await store.show('alice', {})).records.reviewLogs).toEqual([]);
		await expect(store.show('bob', {})).rejects.toThrow('NO_SUCH_MATERIAL');
		const deckId = String(sample.value.deckId);
		const at = Date.parse(String(sample.value.reviewedAt));
		const page = await store.show('alice', { deckId, day: { start: new Date(at).toISOString(), end: new Date(at + 1).toISOString() } });
		expect(page.records.reviewLogs).toHaveLength(20);
		expect(page.historyPage?.today).toContain(sample.value.questionId);
		expect(page.historyPage?.total).toBe(2200 + original.filter(f => f.store === 'reviewLogs' && f.value.deckId === deckId).length);
		const after = page.historyPage?.next;
		if (!after) throw new Error('Expected another page');
		let historyBodies = 0;
		const subscriber: EntitySubscriberInterface = {
			afterQuery(event) {
				for (const row of event.rawResults?.rows ?? []) {
					if (Object.values(row).some(value => typeof value === 'string' && value.includes('"id":"synthetic:'))) historyBodies++;
				}
			},
		};
		db.subscribers.push(subscriber);
		try {
			const next = await store.show('alice', { deckId, after });
			expect(new Set([...page.records.reviewLogs, ...next.records.reviewLogs].map(log => log.id)).size).toBe(40);
			expect(historyBodies).toBeGreaterThan(0);
			expect(historyBodies).toBeLessThanOrEqual(20);
		} finally { db.subscribers.splice(db.subscribers.indexOf(subscriber), 1); }
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const [written, replay] = await Promise.all([store.review('alice', request), store.review('alice', request)]);
		expect(replay).toEqual(written);
		const giftDeck = page.records.decks.find(deck => deck.sourceType === 'gift');
		if (!giftDeck) throw new Error('Expected the fixture GIFT deck');
		const source = Buffer.from('::stable-name:: Sky is blue. {TRUE}');
		const file = await upload('alice', source);
		const update = (token?: string) => store.updateGift('alice', giftDeck.id, file, async () => source, token);
		historyBodies = 0;
		db.subscribers.push(subscriber);
		try {
			const preview = await update();
			expect(preview).toMatchObject({ changed: 1, reset: 1, applied: false });
			expect(await update(preview.token)).toMatchObject({ changed: 1, reset: 1, applied: true });
			await expect(update(preview.token)).rejects.toThrow('STUDY_CONFLICT');
			expect(historyBodies).toBe(0);
		} finally { db.subscribers.splice(db.subscribers.indexOf(subscriber), 1); }
		const reviewedDeck = await store.show('alice', { deckId: giftDeck.id });
		expect(reviewedDeck.records.studyStates.find(state => state.questionId === request.questionId)?.card.reps).toBe(0);
		expect(reviewedDeck.records.reviewLogs.some(log => log.id === written.record.id)).toBe(true);
		const output = await exported(store, 'alice');
		const prefixSize = payload.length - (bytes.length - 64 - 17);
		expect(await sha(output.subarray(0, prefixSize))).toBe(await sha(input.subarray(0, prefixSize)));
		await restore('bob', output);
		expect(await sha(await exported(store, 'bob'))).toBe(await sha(output));
		const [usage] = await db.query('SELECT count, bytes, binaries, "materialBytes" FROM fukushu_source_usage WHERE "ownerId" = $1', ['alice']);
		expect(usage).toEqual((await db.query('SELECT count, bytes, binaries, "materialBytes" FROM fukushu_source_usage WHERE "ownerId" = $1', ['bob']))[0]);
		expect(output.length).toBe(81 + 4 * usage.count + usage.bytes + usage.binaries);
		const runner = db.createQueryRunner();
		try { await expect(new FukushuMaterialBytes1794980000000().down(runner)).rejects.toThrow('previous reader'); } finally { await runner.release(); }
	}, 60_000);

	test('backfills pre-index records once under concurrent page reads and keeps owners separate', async () => {
		for (const owner of ['alice', 'bob']) await store.restore(owner, await upload(owner), randomUUID());
		const deckId = expected.reset.result.record.deckId;
		const before = await exported(store, 'alice');
		const migration = new FukushuDeckHistoryIndex1794990000000();
		const runner = db.createQueryRunner();
		try {
			await migration.down(runner);
			await migration.up(runner);
		} finally { await runner.release(); }
		const [first, second] = await Promise.all([store.show('alice', { deckId }), store.show('alice', { deckId })]);
		expect(first).toEqual(second);
		expect(first.historyPage?.total).toBe(1);
		expect(await db.query(`SELECT DISTINCT "ownerId" FROM fukushu_upstream_record
			WHERE store = 'reviewLogs' AND "historyDeck" IS NULL`)).toEqual([{ ownerId: 'bob' }]);
		expect(await exported(store, 'alice')).toEqual(before);
		expect((await store.show('bob', { deckId })).historyPage?.total).toBe(1);
	});

	test('a new answer at the pilot byte ceiling rolls back state, log and receipt', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await exported(store, 'alice');
		const prior = await counts();
		// Simulate the measured counter at capacity without allocating a 64 MiB collection.
		await db.query('UPDATE fukushu_source_usage SET bytes = $1 WHERE "ownerId" = $2', [64 * 1024 * 1024, 'alice']);
		const { reviewedAt: _time, ...request } = expected.reset.request;
		await expect(store.review('alice', request)).rejects.toThrow('BACKUP_TOO_LARGE');
		expect(await counts()).toEqual(prior);
		expect(await sha(await exported(store, 'alice'))).toBe(await sha(before));
	});

	test('exports more than 8 MiB of persisted history in bounded pages without changing source bytes', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const baseline = await exported(store, 'alice');
		const log = (await readUpstreamArchive(baseline, sha)).frames().find(frame => frame.store === 'reviewLogs');
		if (!log) throw new Error('Expected a source review fixture');
		const expectedHash = createHash('sha256').update(baseline.subarray(0, -64));
		const [{ last }] = await db.query('SELECT last FROM fukushu_source_usage WHERE "ownerId" = $1', ['alice']);
		// Seed the exporter directly to measure its SQL result pages independently of restore.
		const responseText = 'a'.repeat(64 * 1024);
		const sourceHash = await sha(bytes);
		for (let i = 1; i <= 144; i++) {
			const id = 'long-history-' + i;
			const value = { ...log.value, id, responseText };
			const json = Buffer.from(JSON.stringify({ store: 'reviewLogs', value }));
			const length = Buffer.alloc(4);
			length.writeUInt32LE(json.length);
			expectedHash.update(length).update(json);
			await db.query(`INSERT INTO fukushu_upstream_record ("ownerId", store, key, data, position, "sourceHash")
				VALUES ($1, 'reviewLogs', $2, $3, $4, $5)`, ['alice', await sha(Buffer.from(JSON.stringify(id))), JSON.stringify(value), last + i, sourceHash]);
		}
		const trailer = expectedHash.copy().digest('hex');
		expectedHash.update(trailer);
		let largestPage = 0;
		const subscriber: EntitySubscriberInterface = {
			afterQuery(event) {
				const rows = event.rawResults?.rows;
				if (Array.isArray(rows) && typeof rows[0]?.data === 'string') largestPage = Math.max(largestPage, rows.length);
			},
		};
		db.subscribers.push(subscriber);
		try {
			const actual = createHash('sha256');
			let size = 0;
			await store.writeExport('alice', async part => { actual.update(part); size += part.length; });
			expect(size).toBeGreaterThan(9 * 1024 * 1024);
			expect(actual.digest('hex')).toBe(expectedHash.digest('hex'));
			expect(largestPage).toBeGreaterThan(0);
			expect(largestPage).toBeLessThanOrEqual(32);
		} finally {
			db.subscribers.splice(db.subscribers.indexOf(subscriber), 1);
		}
	});

	test('an export overlapping a review retains its original snapshot', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await exported(store, 'alice');
		const { reviewedAt: _time, ...request } = expected.reset.request;
		const parts: Buffer[] = [];
		await store.writeExport('alice', async bytes => {
			if (parts.length === 0) await store.review('alice', request);
			parts.push(bytes);
		});
		expect(Buffer.concat(parts)).toEqual(before);
		expect(await exported(store, 'alice')).not.toEqual(before);
	});

	test('the migration backfills usage for a previously imported collection', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await db.query('SELECT * FROM fukushu_source_usage');
		const runner = db.createQueryRunner();
		try {
			const migration = new FukushuSourceChunks1794974400000();
			await new FukushuMaterialBytes1794980000000().down(runner);
			await migration.down(runner);
			await migration.up(runner);
			await new FukushuMaterialBytes1794980000000().up(runner);
			expect(await db.query('SELECT * FROM fukushu_source_usage')).toEqual(before);
			const { reviewedAt: _time, ...request } = expected.reset.request;
			expect(await store.review('alice', request)).toEqual(expected.reset.result);
		} finally { await runner.release(); }
	});

	test('migration down and up operate only on disposable empty tables', async () => {
		const runner = db.createQueryRunner();
		try { const migration = new FukushuUpstreamStore1794924000000(); const chunks = new FukushuSourceChunks1794974400000(); await new FukushuDeckHistoryIndex1794990000000().down(runner); await new FukushuMaterialBytes1794980000000().down(runner); await chunks.down(runner); await migration.down(runner); await migration.up(runner); await chunks.up(runner); await new FukushuMaterialBytes1794980000000().up(runner); await new FukushuDeckHistoryIndex1794990000000().up(runner); expect(await counts()).toEqual({ records: 0, receipts: 0 }); } finally { await runner.release(); }
	});
});
