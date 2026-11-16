/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { In, IsNull } from 'typeorm';
import { MiUser } from '@features/users/backend/models/User.js';
import { MiBlocking } from '@features/relationships/backend/models/Blocking.js';
import { MiMahjongRoom } from './models/MahjongRoom.js';
import { cancelRoom, createRoom, expireRoom, projectRoom, readyRoom, RoomError, submitRoom } from './room.js';
import type { DataSource } from 'typeorm';
import type { Four } from './reply-gate.js';

export class MahjongStore {
	constructor(private readonly db: DataSource) {}

	async create(user: string, invitees: string[]) {
		if (invitees.length !== 3) throw new RoomError('INVALID_ACTION');
		const users: Four<string> = [user, invitees[0], invitees[1], invitees[2]];
		if (new Set(users).size !== 4) throw new RoomError('INVALID_ACTION');
		return this.db.transaction(async manager => {
			// Serialize per-owner room creation, including across backend workers.
			await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`mahjong:create:${user}`]);
			const local = await manager.getRepository(MiUser).countBy({ id: In([...users]), host: IsNull(), isSuspended: false, isDeleted: false });
			if (local !== 4) throw new RoomError('INVALID_ACTION');
			const blocked = await manager.getRepository(MiBlocking).countBy({ blockerId: In([...users]), blockeeId: In([...users]) });
			if (blocked) throw new RoomError('INVALID_ACTION');
			const repo = manager.getRepository(MiMahjongRoom);
			if (await repo.countBy({ ownerId: user, status: In(['waiting', 'playing']) }) >= 3) throw new RoomError('ROOM_LIMIT');
			const now = Date.now();
			const row = repo.create({ id: randomUUID(), ownerId: user, userIds: [...users], createdAt: new Date(now), updatedAt: new Date(now), status: 'waiting', state: createRoom(users) });
			await repo.insert(row);
			return projectRoom(row.id, row.state, user, now);
		});
	}

	async list(user: string) {
		const rows = await this.db.getRepository(MiMahjongRoom).createQueryBuilder('room')
			.select(['room.id', 'room.userIds', 'room.status', 'room.createdAt'])
			.where(':user = ANY(room."userIds")', { user })
			// Always expose the creator's three occupied slots, even beneath newer invitations.
			.orderBy('CASE WHEN room.status IN (\'waiting\', \'playing\') THEN 0 ELSE 1 END', 'ASC')
			.addOrderBy('CASE WHEN room."ownerId" = :user THEN 0 ELSE 1 END', 'ASC')
			.addOrderBy('room.createdAt', 'DESC').take(30).getMany();
		return rows.map(row => ({ id: row.id, users: row.userIds, status: row.status, createdAt: row.createdAt.toISOString() }));
	}

	async access(user: string, id: string, operation: 'show' | 'ready' | 'cancel' | 'submit', input?: { phaseId: string; actionId: string; requestId: string }) {
		return this.db.transaction(async manager => {
			const repo = manager.getRepository(MiMahjongRoom);
			const row = await repo.createQueryBuilder('room').where('room.id = :id AND :user = ANY(room."userIds")', { id, user })
				.setLock('pessimistic_write').getOne();
			if (!row) throw new RoomError('NO_SUCH_ROOM');
			if (row.state.version !== '9k-invite-v1') throw new Error('Unsupported mahjong rule version');
			const now = Date.now();
			const before = row.state.revision;
			// Timeouts are system decisions, processed before a participant's next request.
			// A disconnected room consumes no background timers; a newly opened phase gets a full deadline.
			// Explicit cancellation must not advance a timed-out hand first.
			if (operation !== 'cancel') expireRoom(row.state, now);
			let rejected: RoomError | null = null;
			try {
				if (operation === 'ready') readyRoom(row.state, user, now);
				if (operation === 'cancel') cancelRoom(row.state, user);
				if (operation === 'submit' && input) submitRoom(row.state, user, input.phaseId, input.actionId, input.requestId, now);
			} catch (error) {
				if (!(error instanceof RoomError)) throw error;
				rejected = error;
			}
			if (row.state.revision !== before) await repo.update(row.id, { state: row.state, status: row.state.status, updatedAt: new Date(now) });
			return { view: projectRoom(row.id, row.state, user, now), rejected };
		}).then(({ view, rejected }) => { if (rejected) throw rejected; return view; });
	}
}
