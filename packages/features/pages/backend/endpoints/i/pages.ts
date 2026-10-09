/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { iPagesContract } from './pages.contract.js';

export function createIPagesProcedure<Actor extends ApiActor>() {
	return implement(iPagesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/pages', requireCredential: true, kind: 'read:pages' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.iPages(input, context.principal));
}
