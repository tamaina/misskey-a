/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { GamesContext } from '../../operations.js';
import { reversiVerifyContract } from './verify.contract.js';

export function createReversiVerifyProcedure<Actor extends ApiActor>() {
	return implement(reversiVerifyContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<GamesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'reversi/verify' }))
		.handler(({ input, context }) => context.operations.games.reversiVerify(input, context.principal));
}
