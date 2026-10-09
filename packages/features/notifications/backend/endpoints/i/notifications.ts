/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';
import { listContract } from './notifications.contract.js';

export function createListProcedure<Actor extends ApiActor>() {
	return implement(listContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/notifications', requireCredential: true, kind: 'read:notifications', limit: { duration: 30000, max: 30 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notifications.list(input, context.principal));
}
