/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { GamesContext } from '../../operations.js';
import { reversiGamesContract } from './games.contract.js';

export function createReversiGamesProcedure<Actor extends ApiActor>() {
	return implement(reversiGamesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'reversi/games' }))
		.handler(({ input, context }) => context.operations.games.reversiGames(input, context.principal));
}
