/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PagesContext } from '../../operations.js';
import { pagesFeaturedContract } from './featured.contract.js';

export function createPagesFeaturedProcedure<Actor extends ApiActor>() {
	return implement(pagesFeaturedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PagesContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'pages/featured' }))
		.handler(({ input, context }) => context.operations.pages.pagesFeatured(input, context.principal));
}
