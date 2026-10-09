/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { PagesContext } from '../operations.js';
import { pagePushContract } from './page-push.contract.js';

export function createPagePushProcedure<Actor extends ApiActor>() {
	return implement(pagePushContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'page-push', requireCredential: true, secure: true }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.pagePush(input, context.principal));
}
