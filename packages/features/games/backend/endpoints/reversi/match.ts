/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { GamesContext } from '../../operations.js';
import { reversiMatchContract } from './match.contract.js';

export function createReversiMatchProcedure<Actor extends ApiActor>() {
	return implement(reversiMatchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'reversi/match', requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.games.reversiMatch(input, context.principal));
}
