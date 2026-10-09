/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { pagesUnlikeContract } from './unlike.contract.js';

export function createPagesUnlikeProcedure<Actor extends ApiActor>() {
	return implement(pagesUnlikeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pages/unlike', requireCredential: true, kind: 'write:page-likes', prohibitMoved: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.pagesUnlike(input, context.principal));
}
