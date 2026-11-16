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
import { Mahjong1794828000000 } from '../../../../../backend/migration/1794828000000-mahjong.js';
import { MahjongStore } from '../../backend/store.js';
import { MiMahjongRoom } from '../../backend/models/MahjongRoom.js';
import { createMahjongProcedures } from '../../backend/endpoints/mahjong.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const socket = process.env.MAHJONG_TEST_SOCKET;
const users = ['alice', 'bob', 'carol', 'dave'];
describe.skipIf(!socket)('isolated PostgreSQL mahjong transport and concurrency', () => {
	const db = new DataSource({ type: 'postgres', host: socket, port: 55473, username: 'mahjong', database: 'postgres', entities, synchronize: false });
	const store = new MahjongStore(db);
	const migration = new Mahjong1794828000000();
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY, host varchar NULL, "isSuspended" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false)');
		await db.query('CREATE TABLE blocking (id varchar PRIMARY KEY, "blockerId" varchar, "blockeeId" varchar)');
		const runner = db.createQueryRunner();
		try {
			await migration.up(runner); await migration.down(runner); await migration.up(runner);
		} finally { await runner.release(); }
	});
	afterAll(async () => { if (db.isInitialized) await db.destroy(); });
	beforeEach(async () => {
		await db.query('TRUNCATE "user", mahjong_room, blocking CASCADE');
		for (const id of [...users, 'outsider']) await db.query('INSERT INTO "user" (id) VALUES ($1)', [id]);
	});

	async function start() {
		const room = await store.create(users[0], users.slice(1));
		await Promise.all(users.map(user => store.access(user, room.id, 'ready')));
		return store.access(users[0], room.id, 'show');
	}

	test('migration up/down/up, invitation checks, nonmembers and creation quota', async () => {
		await expect(store.create('alice', ['alice', 'bob', 'carol'])).rejects.toThrow('INVALID_ACTION');
		await db.query('INSERT INTO blocking VALUES ($1, $2, $3)', ['b', 'bob', 'alice']);
		await expect(store.create('alice', users.slice(1))).rejects.toThrow('INVALID_ACTION');
		await db.query('DELETE FROM blocking');
		const room = await store.create('alice', users.slice(1));
		await expect(store.access('outsider', room.id, 'show')).rejects.toThrow('NO_SUCH_ROOM');
		expect(await store.list('outsider')).toEqual([]);
		expect(await store.list('bob')).toHaveLength(1);
		const results = await Promise.allSettled([1, 2, 3, 4].map(() => store.create('alice', users.slice(1))));
		expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(2);
	});
	test('independent worker instances serialize duplicate actions and recover the same private state', async () => {
		const initial = await start();
		const row = await db.getRepository(MiMahjongRoom).findOneByOrFail({ id: initial.id });
		const player = row.state.phase!.menus.findIndex(menu => menu.some(action => action.kind === 'discard'));
		const input = { phaseId: row.state.phase!.id, actionId: row.state.phase!.menus[player][0].id, requestId: crypto.randomUUID() };
		const otherWorker = new MahjongStore(db);
		const results = await Promise.all([store.access(users[player], initial.id, 'submit', input), otherWorker.access(users[player], initial.id, 'submit', input)]);
		expect(results[0].revision).toBe(results[1].revision);
		const saved = await db.getRepository(MiMahjongRoom).findOneByOrFail({ id: initial.id });
		expect(saved.state.journal!.steps).toHaveLength(1);
		await expect(otherWorker.access(users[player], initial.id, 'submit', { ...input, requestId: crypto.randomUUID() })).rejects.toThrow('STALE_ACTION');
		for (const user of users) {
			const view = await new MahjongStore(db).access(user, initial.id, 'show');
			expect(view.snapshot!.seats.filter(seat => seat.concealedHand !== null).map(seat => seat.userId)).toEqual([user]);
		}
	});
	test('timeout commits even when a late client action is rejected', async () => {
		const initial = await start();
		const repo = db.getRepository(MiMahjongRoom);
		const row = await repo.findOneByOrFail({ id: initial.id });
		const phase = row.state.phase!;
		phase.deadline = Date.now() - 1;
		await repo.update(row.id, { state: row.state });
		await expect(store.access('alice', row.id, 'submit', { phaseId: phase.id, actionId: 'invalid', requestId: crypto.randomUUID() })).rejects.toThrow('STALE_ACTION');
		expect((await repo.findOneByOrFail({ id: row.id })).state.phase!.id).not.toBe(phase.id);
	});
	test('three abandoned started rooms do not permanently lock out their creator', async () => {
		const rooms = await Promise.all([start(), start(), start()]);
		await expect(store.create('alice', users.slice(1))).rejects.toThrow('ROOM_LIMIT');
		const repo = db.getRepository(MiMahjongRoom);
		const row = await repo.findOneByOrFail({ id: rooms[0].id });
		row.state.phase!.deadline = Date.now() - 86_400_000;
		await repo.update(row.id, { state: row.state });
		await expect(store.access('outsider', row.id, 'cancel')).rejects.toThrow('NO_SUCH_ROOM');
		const cancelled = await store.access('bob', row.id, 'cancel');
		expect(cancelled.status).toBe('cancelled');
		expect(cancelled.phase).toBeNull();
		const saved = await repo.findOneByOrFail({ id: row.id });
		expect(saved.state.journal).toEqual(row.state.journal); // No timeout discard before abort.
		for (const user of users) {
			const next = await new MahjongStore(db).access(user, row.id, 'show');
			expect(next.status).toBe('cancelled');
			expect(next.phase).toBeNull();
			expect(next.outcome).toBeNull();
		}
		const created = await Promise.allSettled([1, 2].map(() => new MahjongStore(db).create('alice', users.slice(1))));
		expect(created.filter(result => result.status === 'fulfilled')).toHaveLength(1);
		expect(await store.access('carol', row.id, 'cancel')).toMatchObject({ status: 'cancelled', revision: cancelled.revision });
	});
	test('cancellation serializes with a concurrent action and remains terminal across workers', async () => {
		const initial = await start();
		const repo = db.getRepository(MiMahjongRoom);
		const row = await repo.findOneByOrFail({ id: initial.id });
		const phase = row.state.phase!;
		const player = phase.menus.findIndex(menu => menu.some(action => action.kind === 'discard'));
		const input = { phaseId: phase.id, actionId: phase.menus[player].find(action => action.kind === 'discard')!.id, requestId: crypto.randomUUID() };
		const results = await Promise.allSettled([
			store.access('bob', initial.id, 'cancel'),
			new MahjongStore(db).access(users[player], initial.id, 'submit', input),
		]);
		expect(results[0].status).toBe('fulfilled');
		if (results[1].status === 'rejected') expect(results[1].reason).toMatchObject({ code: 'STALE_ACTION' });
		const saved = await repo.findOneByOrFail({ id: row.id });
		expect(saved.status).toBe('cancelled');
		expect(saved.state.phase).toBeNull();
		expect(saved.state.journal!.steps.length).toBeLessThanOrEqual(1);
		await expect(store.access(users[player], row.id, 'submit', { ...input, requestId: crypto.randomUUID() })).rejects.toThrow('STALE_ACTION');
		expect(await store.access('dave', row.id, 'ready')).toMatchObject({ status: 'cancelled', revision: saved.state.revision });
	});
	test('occupied creator slots stay reachable ahead of newer invitations and history', async () => {
		const room = await start();
		const repo = db.getRepository(MiMahjongRoom);
		const template = await repo.findOneByOrFail({ id: room.id });
		await repo.update(room.id, { createdAt: new Date(0) });
		for (let index = 0; index < 35; index++) {
			await repo.insert({ ...template, id: crypto.randomUUID(), ownerId: 'bob', createdAt: new Date(Date.now() + index) });
		}
		const listed = await store.list('alice');
		expect(listed).toHaveLength(30);
		expect(listed[0].id).toBe(room.id);
		await store.access('alice', room.id, 'cancel');
		expect((await store.list('alice')).every(row => row.status === 'playing')).toBe(true);
	});
	test('real procedures authenticate, deny spectators, and serialize only the requesting seat', async () => {
		const room = await start();
		const api = createMahjongProcedures({ mahjong: store });
		await expect(call(api.mahjongShow, { roomId: room.id }, { context: testContext(null) })).rejects.toThrow();
		for (const id of [...users, 'outsider']) {
			const context = testContext(mockDeep<MiLocalUser>({ id, isSuspended: false, movedToUri: null }));
			if (id === 'outsider') {
				await expect(call(api.mahjongShow, { roomId: room.id }, { context })).rejects.toMatchObject({ code: 'NO_SUCH_ROOM' });
			} else {
				const view = await call(api.mahjongShow, { roomId: room.id }, { context });
				expect(view.snapshot!.seats.filter(seat => seat.concealedHand !== null).map(seat => seat.userId)).toEqual([id]);
				expect(JSON.stringify(view)).not.toMatch(/journal|walls|_paipu|reply/);
			}
		}
	});
});
