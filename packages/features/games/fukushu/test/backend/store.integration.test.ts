/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { FukushuDriveImporter } from '../../backend/drive-import.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import type { InternalStorageService } from '@features/runtime/backend/services/InternalStorageService.js';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { DataSource } from 'typeorm';
import { call } from '@orpc/server';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { FukushuStore } from '../../backend/store.js';
import { material } from './fixture.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('Fukushu private PostgreSQL persistence and API', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', entities, synchronize: false });
	const store = new FukushuStore(db);
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		const migration = new FukushuMaterial1794838800000();
		const runner = db.createQueryRunner();
		try { await migration.up(runner); await migration.down(runner); await migration.up(runner); } finally { await runner.release(); }
	});
	afterAll(async () => { if (db.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await db.query('TRUNCATE "user", fukushu_deck, fukushu_question CASCADE');
		await db.query('INSERT INTO "user" VALUES ($1), ($2)', ['alice', 'bob']);
	});
	test('imports a BOM source through the real parser and store without changing its hash or another owner', async () => {
		const source = '\uFEFF#html:false\n#separator:Tab\n表\t裏';
		const bytes = Buffer.from(source);
		const file = { id: 'source', userId: 'alice', userHost: null, uri: null, isLink: false, storedInternal: true, accessKey: 'source.tsv', name: '教材.tsv', size: bytes.length, md5: createHash('md5').update(bytes).digest('hex') } as MiDriveFile;
		const importer = new FukushuDriveImporter({ findOneBy: async where => !Array.isArray(where) && where.userId === 'alice' ? file : null }, { read: () => Readable.from([bytes]) as ReturnType<InternalStorageService['read']> }, { downloadUrl: async () => { throw new Error('Must use the local original'); } }, store);
		const saved = await importer.import('alice', 'source');
		expect(saved.deck.sourceText).toBe(source);
		expect(saved.deck.sourceHash).toBe(createHash('sha256').update(source).digest('hex'));
		expect(saved.questions[0].payload.prompt.value).toBe('表');
		expect(await store.show('alice', saved.deck.id)).toEqual(saved);
		await expect(importer.import('alice', 'source')).rejects.toMatchObject({ code: 'MATERIAL_EXISTS' });
		await expect(importer.import('bob', 'source')).rejects.toMatchObject({ code: 'NO_SUCH_FILE' });
		expect(await store.list('bob')).toEqual([]);
	});
	test('round trips exact records across store instances and isolates owners sharing original IDs', async () => {
		const original = material();
		const second = material(original.deck.id, 'second-card').questions[0];
		second.sourceKey = second.payload.sourceKey = 'another-source';
		second.sourceOrder = 0;
		second.enabled = false;
		second.enabledKey = 0;
		original.questions.push(second);
		original.deck.questionCount = 2;
		expect(await store.create('alice', original)).toEqual(original);
		await expect(store.show('bob', original.deck.id)).rejects.toThrow('NO_SUCH_MATERIAL');
		await expect(store.show('bob', 'missing')).rejects.toThrow('NO_SUCH_MATERIAL');
		const other = material(); other.questions[0].payload.answer.value = 'Bob private';
		await store.create('bob', other);
		expect(await new FukushuStore(db).show('alice', original.deck.id)).toEqual(original);
		expect(await new FukushuStore(db).show('bob', original.deck.id)).toEqual(other);
	});
	test('serializes concurrent creates without overwrite and rolls back a duplicate card in another deck', async () => {
		const results = await Promise.allSettled([store.create('alice', material()), new FukushuStore(db).create('alice', material())]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_EXISTS' } });
		await expect(store.create('alice', material('another-deck'))).rejects.toThrow('MATERIAL_EXISTS');
		await expect(store.show('alice', 'another-deck')).rejects.toThrow('NO_SUCH_MATERIAL');
		expect(await store.show('alice', 'deck-original')).toEqual(material());
	});
	test('lists only owned summaries in stable ID order without source text', async () => {
		const later = material('z-deck', 'z-card'); later.deck.sourceText = 'private raw source';
		const earlier = material('a-deck', 'a-card');
		await store.create('alice', later);
		await store.create('alice', earlier);
		await store.create('bob', material('bob-deck', 'bob-card'));
		const summaries = await store.list('alice');
		expect(summaries.map(deck => deck.id)).toEqual(['a-deck', 'z-deck']);
		expect(summaries.every(deck => !('sourceText' in deck))).toBe(true);
		expect((await store.list('bob')).map(deck => deck.id)).toEqual(['bob-deck']);
		expect(await store.list('missing-owner')).toEqual([]);
	});
	test('deduplicates source hashes atomically across imports without consuming quota or changing saved cards', async () => {
		const results = await Promise.allSettled(['a', 'b'].map(id => new FukushuStore(db).create('alice', material(id, id), { deduplicateSource: true })));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_EXISTS' } });
		expect(await db.query('SELECT id FROM fukushu_deck')).toHaveLength(1);
		expect(await db.query('SELECT id FROM fukushu_question')).toHaveLength(1);
		const saved = (await store.list('alice'))[0];
		await expect(store.create('alice', material('retry', 'retry'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		expect(await store.show('alice', saved.id)).toEqual(material(saved.id, saved.id));
		// Identical source data can still belong to independent users.
		await expect(store.create('bob', material('other', 'other'), { deduplicateSource: true })).resolves.toEqual(material('other', 'other'));
		// Manual create preserves its original ID-based semantics; source kind matters.
		await store.create('alice', material('manual', 'manual'));
		const otherKind = material('gift', 'gift'); otherKind.deck.sourceType = 'gift';
		await expect(store.create('alice', otherKind, { deduplicateSource: true })).resolves.toEqual(otherKind);
	});
	test('a source retry at the quota is a duplicate and never consumes another slot', async () => {
		await store.create('alice', material());
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data) SELECT $1, n::text, $2::jsonb FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		await expect(store.create('alice', material('retry', 'retry'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		expect(await store.list('alice')).toHaveLength(100);
		expect(await db.query('SELECT id FROM fukushu_question')).toHaveLength(1);
	});
	test('rejects invalid input before any write and cascades account deletion', async () => {
		const invalid = material(); invalid.questions[0].payload.deckId = 'other';
		await expect(store.create('alice', invalid)).rejects.toThrow('INVALID_MATERIAL');
		expect(await db.query('SELECT id FROM fukushu_deck')).toEqual([]);
		await store.create('alice', material());
		await db.query('DELETE FROM "user" WHERE id = $1', ['alice']);
		expect(await db.query('SELECT id FROM fukushu_question')).toEqual([]);
	});
	test('quota remains atomic across workers', async () => {
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data) SELECT $1, n::text, $2::jsonb FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		const results = await Promise.allSettled(['a', 'b'].map(id => new FukushuStore(db).create('alice', material(id, id))));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_LIMIT' } });
	});
	test('real API authenticates, enforces scopes and never accepts a caller-supplied owner', async () => {
		const api = createFukushuRouter(store);
		const alice = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
		const bob = mockDeep<MiLocalUser>({ id: 'bob', isSuspended: false, movedToUri: null });
		const input = { material: material() };
		await expect(call(api.create, input, { context: testContext(null) })).rejects.toThrow();
		await expect(call(api.create, input, { context: testContext(alice, { permission: ['read:account'] }) })).rejects.toThrow();
		await call(api.create, input, { context: testContext(alice, { permission: ['write:account'] }) });
		await expect(call(api.show, { id: input.material.deck.id }, { context: testContext(alice, { permission: ['write:account'] }) })).rejects.toThrow();
		expect(await call(api.show, { id: input.material.deck.id }, { context: testContext(alice, { permission: ['read:account'] }) })).toEqual(input.material);
		await expect(call(api.show, { id: input.material.deck.id, ownerId: 'alice' } as never, { context: testContext(bob) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL' });
	});
});
