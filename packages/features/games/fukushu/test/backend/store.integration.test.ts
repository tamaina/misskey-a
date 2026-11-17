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
import { FukushuMaterialManagement1794871800000 } from '../../../../../backend/migration/1794871800000-FukushuMaterialManagement.js';
import { FukushuMaterial1794838800000 } from '../../../../../backend/migration/1794838800000-FukushuMaterial.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { FukushuStore } from '../../backend/store.js';
import { material } from './fixture.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const managed = (value: ReturnType<typeof material>) => ({ ...value, revision: 1, archivedAt: null });
const socket = process.env.FUKUSHU_TEST_SOCKET;
describe.skipIf(!socket)('Fukushu private PostgreSQL persistence and API', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55474, username: 'fukushu', database: 'postgres', entities, synchronize: false });
	const store = new FukushuStore(db);
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY)');
		const migration = new FukushuMaterial1794838800000();
		const runner = db.createQueryRunner();
		try {
			await migration.up(runner); await migration.down(runner); await migration.up(runner);
			const management = new FukushuMaterialManagement1794871800000();
			await management.up(runner); await management.down(runner); await management.up(runner);
		} finally { await runner.release(); }
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
		expect(await store.show('alice', saved.deck.id)).toEqual(managed(saved));
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
		expect(await new FukushuStore(db).show('alice', original.deck.id)).toEqual(managed(original));
		expect(await new FukushuStore(db).show('bob', original.deck.id)).toEqual(managed(other));
	});
	test('serializes concurrent creates without overwrite and rolls back a duplicate card in another deck', async () => {
		const results = await Promise.allSettled([store.create('alice', material()), new FukushuStore(db).create('alice', material())]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_EXISTS' } });
		await expect(store.create('alice', material('another-deck'))).rejects.toThrow('MATERIAL_EXISTS');
		await expect(store.show('alice', 'another-deck')).rejects.toThrow('NO_SUCH_MATERIAL');
		expect(await store.show('alice', 'deck-original')).toEqual(managed(material()));
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
		expect(await store.show('alice', saved.id)).toEqual(managed(material(saved.id, saved.id)));
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

	test('metadata updates preserve cards, original source, IDs and import time; omitted description clears only that field', async () => {
		const original = material();
		original.deck.description = 'old description';
		original.deck.sourceText = 'original source';
		await store.create('alice', original);
		const before = await db.query('SELECT data, position FROM fukushu_question');
		expect(await store.update('alice', original.deck.id, 1, 'new name', 'new description')).toEqual({ revision: 2, archivedAt: null });
		const saved = await store.show('alice', original.deck.id);
		expect(saved.questions).toEqual(original.questions);
		expect({ ...saved.deck, name: original.deck.name, description: original.deck.description, updatedAt: original.deck.updatedAt }).toEqual(original.deck);
		expect(saved.deck.name).toBe('new name');
		expect(saved.deck.description).toBe('new description');
		expect(saved.deck.updatedAt).not.toBe(original.deck.updatedAt);
		await store.update('alice', original.deck.id, 2, 'without description');
		expect((await store.show('alice', original.deck.id)).deck).not.toHaveProperty('description');
		expect(await db.query('SELECT data, position FROM fukushu_question')).toEqual(before);
	});
	test('concurrent metadata changes allow one revision and reject stale requests across workers', async () => {
		await store.create('alice', material());
		const results = await Promise.allSettled(['first', 'second'].map(name => new FukushuStore(db).update('alice', 'deck-original', 1, name)));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_CONFLICT' } });
		await expect(store.archive('alice', 'deck-original', 1, true)).rejects.toThrow('MATERIAL_CONFLICT');
		expect((await store.show('alice', 'deck-original')).revision).toBe(2);
	});
	test('archive and restore change only management columns and keep exact material data accessible to its owner', async () => {
		const original = material();
		await store.create('alice', original);
		const archived = await store.archive('alice', original.deck.id, 1, true);
		expect(archived.revision).toBe(2);
		expect(archived.archivedAt).toEqual(expect.any(String));
		expect(await store.list('alice')).toEqual([]);
		expect((await store.list('alice', { archived: true })).map(deck => deck.id)).toEqual([original.deck.id]);
		expect(await store.show('alice', original.deck.id)).toEqual({ ...original, ...archived });
		expect(await store.archive('alice', original.deck.id, 2, false)).toEqual({ revision: 3, archivedAt: null });
		expect(await store.show('alice', original.deck.id)).toEqual({ ...original, revision: 3, archivedAt: null });
		expect(await store.list('alice', { archived: true })).toEqual([]);
		expect(await store.list('alice')).toHaveLength(1);
	});
	test('foreign and missing mutation IDs remain indistinguishable and invalid input does not write', async () => {
		await store.create('alice', material());
		for (const id of ['deck-original', 'missing']) {
			await expect(store.update('bob', id, 1, 'foreign')).rejects.toThrow('NO_SUCH_MATERIAL');
			await expect(store.archive('bob', id, 1, true)).rejects.toThrow('NO_SUCH_MATERIAL');
		}
		for (const name of ['', 'x'.repeat(257), '\uD800']) await expect(store.update('alice', 'deck-original', 1, name)).rejects.toThrow('INVALID_MATERIAL');
		for (const revision of [0, 1.5, Number.MAX_SAFE_INTEGER]) await expect(store.archive('alice', 'deck-original', revision, true)).rejects.toThrow('INVALID_MATERIAL');
		expect(await store.show('alice', 'deck-original')).toEqual(managed(material()));
	});
	test('metadata growth cannot invalidate the stored one-MiB material boundary', async () => {
		const original = material();
		original.questions = Array.from({ length: 60 }, (_, i) => {
			const question = structuredClone(original.questions[0]);
			question.id = question.payload.id = `card-${i}`;
			question.sourceKey = question.payload.sourceKey = `source-${i}`;
			question.payload.prompt.value = 'x'.repeat(16_384);
			return question;
		});
		original.deck.questionCount = original.deck.enabledQuestionCount = original.questions.length;
		original.deck.sourceText = '';
		original.deck.sourceText = 'x'.repeat(1_048_576 - 16 - new TextEncoder().encode(JSON.stringify(original)).byteLength);
		await store.create('alice', original);
		await expect(store.update('alice', original.deck.id, 1, 'x'.repeat(256))).rejects.toThrow('INVALID_MATERIAL');
		expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
	});
	test('archive and metadata updates share the same revision guard across workers', async () => {
		await store.create('alice', material());
		const results = await Promise.allSettled([
			store.archive('alice', 'deck-original', 1, true),
			new FukushuStore(db).update('alice', 'deck-original', 1, 'competing name'),
		]);
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'MATERIAL_CONFLICT' } });
		expect((await store.show('alice', 'deck-original')).revision).toBe(2);
	});
	test('archived materials retain source deduplication and total quota', async () => {
		await store.create('alice', material());
		await store.archive('alice', 'deck-original', 1, true);
		await expect(store.create('alice', material('copy', 'copy'), { deduplicateSource: true })).rejects.toThrow('MATERIAL_EXISTS');
		await db.query('INSERT INTO fukushu_deck ("ownerId", id, data, "archivedAt") SELECT $1, n::text, $2::jsonb, now() FROM generate_series(1,99) n', ['alice', JSON.stringify(material().deck)]);
		await expect(store.create('alice', material('new', 'new'))).rejects.toThrow('MATERIAL_LIMIT');
		expect(await store.list('alice')).toEqual([]);
		expect(await store.list('alice', { archived: true })).toHaveLength(100);
		await store.archive('alice', 'deck-original', 2, false);
		expect(await store.list('alice')).toHaveLength(1);
	});
	test('management migration round trips existing payloads without dropping a card', async () => {
		const original = material();
		await store.create('alice', original);
		await store.archive('alice', original.deck.id, 1, true);
		const migration = new FukushuMaterialManagement1794871800000();
		const runner = db.createQueryRunner();
		try {
			await migration.down(runner);
			expect((await db.query('SELECT data FROM fukushu_deck'))[0].data).toEqual(original.deck);
			expect((await db.query('SELECT data FROM fukushu_question'))[0].data).toEqual(original.questions[0]);
			await migration.up(runner);
		} finally { await runner.release(); }
		expect(await store.show('alice', original.deck.id)).toEqual(managed(original));
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
		expect(await call(api.show, { id: input.material.deck.id }, { context: testContext(alice, { permission: ['read:account'] }) })).toEqual(managed(input.material));
		await expect(call(api.show, { id: input.material.deck.id, ownerId: 'alice' } as never, { context: testContext(bob) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL' });
	});
});
