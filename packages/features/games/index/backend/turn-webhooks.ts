/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { canReceiveReversiTurn } from '../../reversi/backend/turn-webhook.js';
import type { Redis } from 'ioredis';
import { canReceiveMahjongTurn } from '../../mahjong/backend/turn-webhook.js';
import type { GameTurnReference } from '../shared/turn-webhook.schema.js';
import type { EntityManager } from 'typeorm';

export function canReceiveGameTurn(manager: EntityManager, userId: string, turn: GameTurnReference, stateKey?: string, redis?: Pick<Redis, 'mget'>): Promise<boolean> {
	switch (turn.game) {
		case 'mahjong': return canReceiveMahjongTurn(manager, userId, turn);
		case 'reversi': return stateKey && redis ? canReceiveReversiTurn(manager, redis, userId, turn, stateKey) : Promise.resolve(false);
	}
}
