/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { GamesContext } from '../../operations.js';
import { bubbleGameRegisterContract } from './register.contract.js';

export function createBubbleGameRegisterProcedure<Actor extends ApiActor>() {
	return implement(bubbleGameRegisterContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'bubble-game/register', requireCredential: true, kind: 'write:account', limit: { duration: 3_600_000, max: 120, minInterval: 30_000 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.games.bubbleGameRegister(input, context.principal));
}
