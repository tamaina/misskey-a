/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { canReceiveMahjongTurn } from '../../mahjong/backend/turn-webhook.js';
import type { GameTurnReference } from '../shared/turn-webhook.schema.js';
import type { EntityManager } from 'typeorm';

export function canReceiveGameTurn(manager: EntityManager, userId: string, turn: GameTurnReference): Promise<boolean> {
	switch (turn.game) {
		case 'mahjong': return canReceiveMahjongTurn(manager, userId, turn);
	}
}
