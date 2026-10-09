/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';
import { createContract } from './create.contract.js';

export function createCreateProcedure<Actor extends ApiActor>() {
	return implement(createContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'notifications/create', requireCredential: true, kind: 'write:notifications', limit: { duration: 60000, max: 10 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notifications.create(input, context.principal, context.token));
}
