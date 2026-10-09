/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { flashUnlikeContract } from './unlike.contract.js';

export function createFlashUnlikeProcedure<Actor extends ApiActor>() {
	return implement(flashUnlikeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'flash/unlike', requireCredential: true, kind: 'write:flash-likes', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.play.flashUnlike(input, context.principal));
}
