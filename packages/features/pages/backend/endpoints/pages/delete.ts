/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { pagesDeleteContract } from './delete.contract.js';

export function createPagesDeleteProcedure<Actor extends ApiActor>() {
	return implement(pagesDeleteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pages/delete', requireCredential: true, kind: 'write:pages' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.pages.pagesDelete(input, context.principal));
}
