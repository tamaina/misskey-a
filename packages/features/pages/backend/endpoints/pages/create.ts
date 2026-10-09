/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { pagesCreateContract } from './create.contract.js';

export function createPagesCreateProcedure<Actor extends ApiActor>() {
	return implement(pagesCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pages/create', requireCredential: true, kind: 'write:pages', prohibitMoved: true, limit: { duration: 3_600_000, max: 10 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.pagesCreate(input, context.principal));
}
