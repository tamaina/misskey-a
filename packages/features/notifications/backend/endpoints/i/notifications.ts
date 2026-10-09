/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedNotification } from '../../notification.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { listContract } from './notifications.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
import { readNotifications } from '@features/notifications/backend/notification-list.js';
export type ListDependencies = Pick<NotificationsDependencies, 'readAllNotification' | 'packMany' | 'generateId' | 'getNotifications'>;
export function createListProcedure(deps: ListDependencies) {
	return createApiProcedure<MiLocalUser>()(listContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const records = await readNotifications(deps, input, actor);
			if (records === null) return [];
			if (input.markAsRead) void deps.readAllNotification(actor.id);
			return (await deps.packMany(records, actor.id)).map(toPackedNotification);
		});
}
