/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { GamesContext } from '../../operations.js';
import { bubbleGameRankingContract, bubbleGameRankingGetContract } from './ranking.contract.js';

export function createBubbleGameRankingProcedure<Actor extends ApiActor>() {
	return implement(bubbleGameRankingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'bubble-game/ranking' }))
		.handler(({ input, context }) => context.operations.games.bubbleGameRanking(input, context.principal));
}
export function createBubbleGameRankingGetProcedure<Actor extends ApiActor>() {
	return implement(bubbleGameRankingGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'bubble-game/ranking' }))
		.handler(({ input, context }) => context.operations.games.bubbleGameRanking(input, context.principal));
}
