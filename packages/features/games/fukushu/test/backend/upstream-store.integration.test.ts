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
import { FukushuStore } from '../../backend/store.js';
import { readUpstreamArchive } from '../../shared/upstream-reader.js';
import { encodeUpstreamFrames } from '../../backend/pilot/upstream-session.js';
import { material } from './fixture.js';

const sha = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const bytes = readFileSync('../features/games/fukushu/test/backend/fixtures/actual-upstream/actual-upstream.fukushu');
const expected = JSON.parse(readFileSync('../features/games/fukushu/test/backend/fixtures/actual-upstream/expected-continuation.json', 'utf8'));
const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('persistent source-shaped Fukushu', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', schema: 'fukushu_upstream_test', extra: { options: '-c search_path=fukushu_upstream_test', max: 4 }, entities, synchronize: false });
	const files = new Map<string, Buffer>();
	const reader = { read: async (_owner: string, id: string) => files.get(id)! };
	const makeStore = () => new FukushuUpstreamStore(db, reader, () => new Date(expected.reset.request.reviewedAt));
	const store = makeStore();
	const counts = async () => (await db.query('SELECT (SELECT COUNT(*)::integer FROM fukushu_upstream_record) AS records, (SELECT COUNT(*)::integer FROM fukushu_operation_receipt) AS receipts'))[0];
	beforeAll(async () => {
		await db.initialize(); await db.query('CREATE SCHEMA fukushu_upstream_test');
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		await db.query('CREATE TABLE drive_file (id varchar(32) PRIMARY KEY, "userId" varchar(32) REFERENCES "user"(id), "userHost" text, uri text, "isLink" boolean NOT NULL DEFAULT false, size integer NOT NULL, md5 text NOT NULL)');
		const runner = db.createQueryRunner();
		try { for (const Migration of [FukushuMaterial1794838800000, FukushuMaterialManagement1794871800000, FukushuQuestionVersions1794880800000, FukushuStudy1794891600000, FukushuUpstreamStore1794924000000]) await new Migration().up(runner); } finally { await runner.release(); }
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
		expect((await readUpstreamArchive(await makeStore().export('alice'), sha)).frames()).toEqual(original.frames());
		const { reviewedAt: _time, ...request } = expected.reset.request;
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
		const output = await readUpstreamArchive(await store.export('alice'), sha);
		expect(output.normalizedRecords().reviewLogs).toHaveLength(38);
		expect(output.frames().filter(f => f.blob !== undefined)).toEqual(original.frames().filter(f => f.blob !== undefined));
		expect(await counts()).toMatchObject({ receipts: 2 });
	});

	test('owner isolation and identical source IDs for different owners', async () => {
		const file = await upload('alice'); const request = randomUUID();
		await store.restore('alice', file, request);
		await expect(store.show('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(store.export('bob')).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(store.restore('bob', file, request)).rejects.toThrow('NO_SUCH_FILE');
		await store.restore('bob', await upload('bob'), randomUUID());
		expect(await store.show('alice')).toEqual(await store.show('bob'));
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
		const before = await store.export('alice'); const totals = await counts();
		await expect(store.restore('alice', file, randomUUID())).rejects.toThrow('BACKUP_CONFLICT');
		expect(await store.export('alice')).toEqual(before); expect(await counts()).toEqual(totals);
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
		await db.query("CREATE FUNCTION fail_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected rollback'; END $$");
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
			const raced = new FukushuUpstreamStore(db, { read: async () => {
				await db.query(change === 'owner' ? 'UPDATE drive_file SET "userId" = $1 WHERE id = $2' : 'UPDATE drive_file SET md5 = $1 WHERE id = $2', [change === 'owner' ? 'bob' : 'changed', file]);
				return bytes;
			} });
			await expect(raced.restore('alice', file, randomUUID())).rejects.toThrow(change === 'owner' ? 'NO_SUCH_FILE' : 'BACKUP_FAILED');
			expect(await counts()).toEqual({ records: 0, receipts: 0 });
		}
	});

	test('late review receipt failure restores the previous schedule and log set, then permits a retry', async () => {
		await store.restore('alice', await upload('alice'), randomUUID());
		const before = await store.export('alice'); const totals = await counts();
		const { reviewedAt: _time, ...request } = expected.reset.request;
		await db.query("CREATE FUNCTION fail_review_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected review rollback'; END $$");
		await db.query('CREATE TRIGGER injected BEFORE INSERT ON fukushu_operation_receipt FOR EACH ROW EXECUTE FUNCTION fail_review_receipt()');
		try {
			await expect(store.review('alice', request)).rejects.toThrow('injected review rollback');
			expect(await store.export('alice')).toEqual(before); expect(await counts()).toEqual(totals);
		} finally { await db.query('DROP TRIGGER injected ON fukushu_operation_receipt'); await db.query('DROP FUNCTION fail_review_receipt()'); }
		expect(await makeStore().review('alice', request)).toEqual(expected.reset.result);
	});

	test('synthetic non-UUID/control/surrogate IDs survive PostgreSQL without jsonb rewriting', async () => {
		const frames = (await readUpstreamArchive(bytes, sha)).frames();
		const log = frames.find(row => row.store === 'reviewLogs')!; log.value.id = 'anki:control\u0000\ud800';
		const input = Buffer.from((await encodeUpstreamFrames(frames)).originalBytes());
		await store.restore('alice', await upload('alice', input), randomUUID());
		expect((await readUpstreamArchive(await store.export('alice'), sha)).frames()).toEqual(frames);
	});

	test('migration down and up operate only on disposable empty tables', async () => {
		const runner = db.createQueryRunner();
		try { const migration = new FukushuUpstreamStore1794924000000(); await migration.down(runner); await migration.up(runner); expect(await counts()).toEqual({ records: 0, receipts: 0 }); } finally { await runner.release(); }
	});
});
