/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBlocking } from '@features/relationships/backend/models/Blocking.js';
import { MiMahjongRoom } from '../../backend/models/MahjongRoom.js';
import { MahjongStore } from '../../backend/store.js';
import type { DataSource } from 'typeorm';

type BlockEdge = { blockerId: string; blockeeId: string };

function matchesWhere(edge: BlockEdge, clause: { blockerId?: unknown; blockeeId?: unknown }): boolean {
	const matchField = (actual: string, expected: unknown) => {
		if (typeof expected === 'string') return actual === expected;
		if (expected && typeof expected === 'object' && '_value' in expected && Array.isArray((expected as { _value: unknown[] })._value)) {
			return (expected as { _value: unknown[] })._value.includes(actual);
		}
		return false;
	};
	return matchField(edge.blockerId, clause.blockerId) && matchField(edge.blockeeId, clause.blockeeId);
}

function createFakeStore(blocks: BlockEdge[]) {
	const rooms = new Map<string, MiMahjongRoom>();
	const manager = {
		query: async () => [],
		getRepository(entity: unknown) {
			if (entity === MiUser) {
				return { countBy: async () => 4 };
			}
			if (entity === MiBlocking) {
				return {
					countBy: async (where: unknown) => {
						const clauses = Array.isArray(where) ? where : [where];
						return blocks.filter(edge => clauses.some(clause => matchesWhere(edge, clause as { blockerId?: unknown; blockeeId?: unknown }))).length;
					},
				};
			}
			if (entity === MiMahjongRoom) {
				return {
					countBy: async () => 0,
					create: (data: Partial<MiMahjongRoom>) => ({ ...data }) as MiMahjongRoom,
					insert: async (row: MiMahjongRoom) => { rooms.set(row.id, row); },
					update: async (id: string, patch: Partial<MiMahjongRoom>) => {
						const row = rooms.get(id);
						if (row) Object.assign(row, patch);
					},
					createQueryBuilder: () => {
						let targetId = '';
						let targetUser = '';
						return {
							where(_sql: string, params: { id: string; user: string }) {
								targetId = params.id;
								targetUser = params.user;
								return this;
							},
							setLock() { return this; },
							async getOne() {
								const row = rooms.get(targetId);
								return row && row.userIds.includes(targetUser) ? row : null;
							},
						};
					},
				};
			}
			throw new Error(`Unexpected repository: ${String(entity)}`);
		},
	};
	const db = {
		transaction: async <T>(fn: (m: typeof manager) => Promise<T>) => fn(manager),
	} as unknown as DataSource;
	return { store: new MahjongStore(db), rooms };
}

test('invitation creation ignores third-party blocks between invitees, while readiness enforces participant blocks', async () => {
	const blocks: BlockEdge[] = [{ blockerId: 'bob', blockeeId: 'carol' }];
	const { store } = createFakeStore(blocks);

	// Inviter Alice is unrelated to Bob->Carol block, so creation succeeds without leaking it.
	const room = await store.create('alice', ['bob', 'carol', 'dave']);
	expect(room.status).toBe('waiting');

	// Uninvolved participants can ready normally.
	const aliceReady = await store.access('alice', room.id, 'ready');
	expect(aliceReady.ready).toEqual([true, false, false, false]);
	const daveReady = await store.access('dave', room.id, 'ready');
	expect(daveReady.ready).toEqual([true, false, false, true]);

	// Both sides of the block are rejected on ready, preventing the blocked pair from starting.
	await expect(store.access('bob', room.id, 'ready')).rejects.toThrow('INVALID_ACTION');
	await expect(store.access('carol', room.id, 'ready')).rejects.toThrow('INVALID_ACTION');
});

test('invitation creation still rejects blocks involving the inviter', async () => {
	const { store: outbound } = createFakeStore([{ blockerId: 'alice', blockeeId: 'bob' }]);
	await expect(outbound.create('alice', ['bob', 'carol', 'dave'])).rejects.toThrow('INVALID_ACTION');

	const { store: inbound } = createFakeStore([{ blockerId: 'bob', blockeeId: 'alice' }]);
	await expect(inbound.create('alice', ['bob', 'carol', 'dave'])).rejects.toThrow('INVALID_ACTION');
});
