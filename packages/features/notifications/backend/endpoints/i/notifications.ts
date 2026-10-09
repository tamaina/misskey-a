/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { listContract } from './notifications.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
import { readNotifications } from '@features/notifications/backend/notification-list.js';
export type ListDependencies = Pick<NotificationsDependencies, 'readAllNotification' | 'packMany' | 'generateId' | 'getNotifications'>;
export function createListProcedure(deps: ListDependencies) {
	return implement(listContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: listContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:notifications', limit: { duration: 30000, max: 30 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const records = await readNotifications(deps, input, actor);
			if (records === null) return [];
			if (input.markAsRead) void deps.readAllNotification(actor.id);
			return deps.packMany(records, actor.id);
		});
}
