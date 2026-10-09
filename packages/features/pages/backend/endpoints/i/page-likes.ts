/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { iPageLikesContract } from './page-likes.contract.js';

export function createIPageLikesProcedure<Actor extends ApiActor>() {
	return implement(iPageLikesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/page-likes', requireCredential: true, kind: 'read:page-likes' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.iPageLikes(input, context.principal));
}
