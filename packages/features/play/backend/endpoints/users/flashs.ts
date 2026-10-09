/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { usersFlashsContract } from './flashs.contract.js';

export function createUsersFlashsProcedure<Actor extends ApiActor>() {
	return implement(usersFlashsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'users/flashs' }))
		.handler(({ input, context }) => context.operations.play.usersFlashs(input, context.principal));
}
