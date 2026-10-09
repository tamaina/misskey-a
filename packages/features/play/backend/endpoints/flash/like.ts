/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { flashLikeContract } from './like.contract.js';

export function createFlashLikeProcedure<Actor extends ApiActor>() {
	return implement(flashLikeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'flash/like', requireCredential: true, kind: 'write:flash-likes', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.play.flashLike(input, context.principal));
}
