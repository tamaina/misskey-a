/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuQuestionVersions1794880800000 } from '../../../../../backend/migration/1794880800000-FukushuQuestionVersions.js';
import { FukushuStudy1794891600000 } from '../../../../../backend/migration/1794891600000-FukushuStudy.js';
import { FukushuUpstreamStore1794924000000 } from '../../../../../backend/migration/1794924000000-FukushuUpstreamStore.js';
import { FukushuUpstreamStore } from '../../backend/upstream-store.js';
import { FukushuSourceChunks1794974400000 } from '../../../../../backend/migration/1794974400000-FukushuSourceChunks.js';
import { FukushuStore } from '../../backend/store.js';
import { scanSourceArchive } from '../../shared/source-scan.js';
import { readUpstreamArchive } from '../../shared/upstream-reader.js';
import { encodeUpstreamFrames } from '../../backend/pilot/upstream-session.js';
import { material } from './fixture.js';
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
		await db.query('CREATE TABLE drive_file (id varchar(32) PRIMARY KEY, "userId" varchar(32) REFERENCES "user"(id), "userHost" text, uri text, "isLink" boolean NOT NULL DEFAULT false, size integer NOT NULL, md5 text NOT NULL)');
		const runner = db.createQueryRunner();
		try { for (const Migration of [FukushuMaterial1794838800000, FukushuMaterialManagement1794871800000, FukushuQuestionVersions1794880800000, FukushuStudy1794891600000, FukushuUpstreamStore1794924000000, FukushuSourceChunks1794974400000]) await new Migration().up(runner); } finally { await runner.release(); }
	});
	afterAll(async () => { if (db.isInitialized) { try { await db.query('DROP SCHEMA fukushu_upstream_test CASCADE'); } finally { await db.destroy(); } } });
	beforeEach(async () => { await db.query('TRUNCATE "user" CASCADE'); await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']); files.clear(); });

	async function upload(owner: string, content = bytes) {
		const id = `file-${files.size}`; files.set(id, content);
		await db.query('INSERT INTO drive_file (id,"userId",size,md5) VALUES ($1,$2,$3,$4)', [id, owner, content.length, createHash('md5').update(content).digest('hex')]);
		return id;
	}

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
			await migration.down(runner);
			await migration.up(runner);
			expect(await db.query('SELECT * FROM fukushu_source_usage')).toEqual(before);
			const { reviewedAt: _time, ...request } = expected.reset.request;
			expect(await store.review('alice', request)).toEqual(expected.reset.result);
		} finally { await runner.release(); }
	});

	test('migration down and up operate only on disposable empty tables', async () => {
		const runner = db.createQueryRunner();
		try { const migration = new FukushuUpstreamStore1794924000000(); const chunks = new FukushuSourceChunks1794974400000(); await chunks.down(runner); await migration.down(runner); await migration.up(runner); await chunks.up(runner); expect(await counts()).toEqual({ records: 0, receipts: 0 }); } finally { await runner.release(); }
	});
});
