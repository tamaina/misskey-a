/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiMahjongRoom } from './models/MahjongRoom.js';
import type { EntityManager } from 'typeorm';
import type { RoomState } from './room.js';
import type { GameTurnReference } from '../shared/turn-webhook.schema.js';

export function actionableTurnUsers(room: RoomState, now: number): string[] {
	const phase = room.phase;
	if (room.status !== 'playing' || !phase || phase.deadline <= now) return [];
	return room.users.filter((_, seat) => phase.selected[seat] === null
		&& phase.menus[seat].some(action => action.kind !== 'pass' && action.kind !== 'continue'));
}

export async function canReceiveGameTurn(manager: EntityManager, userId: string, turn: GameTurnReference): Promise<boolean> {
	// Selection and membership are checked against the current committed room, not the queued job.
	const room = await manager.getRepository(MiMahjongRoom).createQueryBuilder('room').select(['room.state'])
		.where('room.id = :id AND :userId = ANY(room."userIds")', { id: turn.roomId, userId }).getOne();
	return !!room && room.state.phase?.id === turn.phaseId && room.state.revision >= turn.revision
		&& actionableTurnUsers(room.state, Date.now()).includes(userId);
}
