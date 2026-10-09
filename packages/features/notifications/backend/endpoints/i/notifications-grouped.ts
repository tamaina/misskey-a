/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { groupedContract } from './notifications-grouped.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NotificationsContext } from '../../operations.js';

export function createGroupedProcedure<Actor extends ApiActor>() {
	return implement(groupedContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotificationsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/notifications-grouped', requireCredential: true, kind: 'read:notifications', limit: { duration: 30000, max: 30 } }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notifications.grouped(input, context.principal));
}
