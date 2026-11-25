/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { call } from '@orpc/server';
import { mockDeep } from 'vitest-mock-extended';
import { entities } from '@features/persistence/backend/postgres.js';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { Mahjong1794828000000 } from '../../../../../backend/migration/1794828000000-mahjong.js';
import { MahjongRoomMemberIndex1795320000318 } from '../../../../../backend/migration/1795320000318-MahjongRoomMemberIndex.js';
import { MahjongStore } from '../../backend/store.js';
import { canReceiveMahjongTurn } from '../../backend/turn-webhook.js';
import type { MahjongTurnReference } from '../../../index/shared/turn-webhook.schema.js';
import { MiMahjongRoom } from '../../backend/models/MahjongRoom.js';
import { createMahjongProcedures } from '../../backend/endpoints/mahjong.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const socket = process.env.MAHJONG_TEST_SOCKET;
const users = ['alice', 'bob', 'carol', 'dave'];
describe.skipIf(!socket)('isolated PostgreSQL mahjong transport and concurrency', () => {
	const db = new DataSource({
		type: 'postgres', host: socket, port: 55473, username: 'mahjong', database: 'postgres', entities, synchronize: false,
		migrations: [Mahjong1794828000000, MahjongRoomMemberIndex1795320000318],
		migrationsTransactionMode: process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1' ? 'each' : 'all',
	});
	const store = new MahjongStore(db);
	beforeAll(async () => {
		await db.initialize();
		await db.query('CREATE TABLE "user" (id varchar(32) PRIMARY KEY, host varchar NULL, "isSuspended" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false)');
		await db.query('CREATE TABLE blocking (id varchar PRIMARY KEY, "blockerId" varchar, "blockeeId" varchar)');
		expect(await db.runMigrations()).toHaveLength(2);
		await db.undoLastMigration();
		expect(await db.query('SELECT to_regclass($1) AS index_name', ['"IDX_mahjong_room_user_ids_gin"'])).toEqual([{ index_name: null }]);
		await db.undoLastMigration();
		expect(await db.runMigrations()).toHaveLength(2);
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
		// A private block between two invitees must not fail room creation for an unrelated inviter,
		// while blocking readiness for the involved participants.
		await db.query('INSERT INTO blocking VALUES ($1, $2, $3)', ['b2', 'bob', 'carol']);
		const thirdPartyBlockRoom = await store.create('alice', users.slice(1));
		await expect(store.access('bob', thirdPartyBlockRoom.id, 'ready')).rejects.toThrow('INVALID_ACTION');
		await expect(store.access('carol', thirdPartyBlockRoom.id, 'ready')).rejects.toThrow('INVALID_ACTION');
		await store.access('alice', thirdPartyBlockRoom.id, 'cancel');
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
	test('publishes new actionable phase references once and only after commit', async () => {
		const repo = db.getRepository(MiMahjongRoom);
		const delivered: { userId: string; turn: MahjongTurnReference; visibleRevision: number }[] = [];
		const publish = vi.fn(async (userId: string, turn: MahjongTurnReference) => {
			const committed = await repo.findOneByOrFail({ id: turn.roomId });
			delivered.push({ userId, turn, visibleRevision: committed.state.revision });
		});
		const worker = new MahjongStore(db, publish);
		const secondWorker = new MahjongStore(db, publish);
		const initial = await worker.create(users[0], users.slice(1));
		for (const user of users.slice(0, 3)) await worker.access(user, initial.id, 'ready');
		expect(publish).not.toHaveBeenCalled();
		await Promise.all([worker.access(users[3], initial.id, 'ready'), secondWorker.access(users[3], initial.id, 'ready')]);
		await expect.poll(() => delivered.length).toBe(1);
		const first = delivered[0];
		const saved = await repo.findOneByOrFail({ id: initial.id });
		const actor = saved.state.users[saved.state.phase!.menus.findIndex(menu => menu.some(action => action.kind === 'discard'))];
		expect(first).toEqual({ userId: actor, turn: { game: 'mahjong', roomId: initial.id, phaseId: saved.state.phase!.id, revision: saved.state.revision }, visibleRevision: saved.state.revision });
		expect(await canReceiveMahjongTurn(db.manager, actor, first.turn)).toBe(true);
		for (const user of [...users, 'outsider'].filter(user => user !== actor)) expect(await canReceiveMahjongTurn(db.manager, user, first.turn)).toBe(false);
		await Promise.all(users.map(user => worker.access(user, initial.id, 'show')));
		expect(publish).toHaveBeenCalledTimes(1);
		const stalePhase = saved.state.phase!;
		const player = saved.state.users.indexOf(actor);
		const input = { phaseId: stalePhase.id, actionId: stalePhase.menus[player].find(action => action.kind === 'discard')!.id, requestId: crypto.randomUUID() };
		await Promise.all([worker.access(actor, initial.id, 'submit', input), secondWorker.access(actor, initial.id, 'submit', input)]);
		expect(await canReceiveMahjongTurn(db.manager, actor, first.turn)).toBe(false);
		const after = await repo.findOneByOrFail({ id: initial.id });
		const phase = after.state.phase!;
		const eligible = after.state.users.filter((_, seat) => phase.selected[seat] === null && phase.menus[seat].some(action => !['continue', 'pass'].includes(action.kind)));
		await expect.poll(() => delivered.length).toBe(eligible.length + 1);
		expect(delivered.slice(1).map(entry => entry.userId).sort()).toEqual([...eligible].sort());
		for (const item of delivered.slice(1)) expect(item.turn).toEqual({ game: 'mahjong', roomId: initial.id, phaseId: phase.id, revision: after.state.revision });
		await worker.access(actor, initial.id, 'cancel');
		for (const user of eligible) expect(await canReceiveMahjongTurn(db.manager, user, delivered[1].turn)).toBe(false);
		expect(publish).toHaveBeenCalledTimes(eligible.length + 1);
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
		const now = Date.now();
		const invitations = Array.from({ length: 35 }, () => crypto.randomUUID());
		for (const [index, id] of invitations.entries()) {
			await repo.insert({ ...template, id, ownerId: 'bob', createdAt: new Date(now + index) });
		}
		await repo.insert({
			...template, id: crypto.randomUUID(), ownerId: 'bob', userIds: ['alice2', 'bob', 'carol', 'dave'],
			createdAt: new Date(now + invitations.length),
		});
		const listed = await store.list('alice');
		expect(listed).toHaveLength(30);
		expect(listed.map(row => row.id)).toEqual([room.id, ...invitations.slice(-29).reverse()]);
		await store.access('alice', room.id, 'cancel');
		const after = await store.list('alice');
		expect(after.every(row => row.status === 'playing')).toBe(true);
		expect(after.map(row => row.id)).toEqual(invitations.slice(-30).reverse());
	});
	test('the lobby membership query can use the GIN index', async () => {
		await store.create('alice', users.slice(1));
		const log = vi.spyOn(db.logger, 'logQuery');
		try {
			await store.list('alice');
			const call = log.mock.calls.find(([sql]) => sql.includes('FROM "mahjong_room"'));
			if (!call) throw new Error('Expected a lobby query');
			const [sql, parameters] = call;
			await db.transaction(async manager => {
				// The fixture is small enough that a table scan is normally cheaper.
				await manager.query('SET LOCAL enable_seqscan = off');
				const plan = await manager.query(`EXPLAIN (FORMAT JSON) ${sql}`, parameters);
				expect(JSON.stringify(plan)).toContain('IDX_mahjong_room_user_ids_gin');
			});
		} finally { log.mockRestore(); }
	});
	test('real procedures authenticate, deny spectators, and serialize only the requesting seat', async () => {
		const room = await start();
		const api = createMahjongProcedures({ mahjong: store });
		await expect(call(api.mahjongRooms, {}, { context: testContext(null) })).rejects.toThrow();
		await expect(call(api.mahjongShow, { roomId: room.id }, { context: testContext(null) })).rejects.toThrow();
		for (const id of [...users, 'outsider']) {
			const context = testContext(mockDeep<MiLocalUser>({ id, isSuspended: false, movedToUri: null }));
			const listed = await call(api.mahjongRooms, {}, { context });
			if (id === 'outsider') {
				expect(listed).toEqual([]);
				await expect(call(api.mahjongShow, { roomId: room.id }, { context })).rejects.toMatchObject({ code: 'NO_SUCH_ROOM' });
			} else {
				expect(listed).toEqual([{ id: room.id, users, status: 'playing', createdAt: expect.any(String) }]);
				const view = await call(api.mahjongShow, { roomId: room.id }, { context });
				expect(view.snapshot!.seats.filter(seat => seat.concealedHand !== null).map(seat => seat.userId)).toEqual([id]);
				expect(JSON.stringify(view)).not.toMatch(/journal|walls|_paipu|reply/);
			}
		}
	});
});
