/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { usersPagesContract } from './pages.contract.js';

export function createUsersPagesProcedure<Actor extends ApiActor>() {
	return implement(usersPagesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'users/pages' }))
		.handler(({ input, context }) => context.operations.pages.usersPages(input, context.principal));
}
