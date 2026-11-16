/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
