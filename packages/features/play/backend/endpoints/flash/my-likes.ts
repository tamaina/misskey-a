/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PlayContext } from '../../operations.js';
import { flashMyLikesContract } from './my-likes.contract.js';

export function createFlashMyLikesProcedure<Actor extends ApiActor>() {
	return implement(flashMyLikesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PlayContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'flash/my-likes', requireCredential: true, kind: 'read:flash-likes' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.play.flashMyLikes(input, context.principal));
}
