/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { notificationsContract } from './endpoints/notifications.contract.js';
import { createListProcedure } from './endpoints/i/notifications.js';
import { createGroupedProcedure } from './endpoints/i/notifications-grouped.js';
import { createCreateProcedure } from './endpoints/notifications/create.js';
import { createFlushProcedure } from './endpoints/notifications/flush.js';
import { createMarkAllAsReadProcedure } from './endpoints/notifications/mark-all-as-read.js';
import { createTestNotificationProcedure } from './endpoints/notifications/test-notification.js';
import { createRegisterProcedure } from './endpoints/sw/register.js';
import { createShowRegistrationProcedure } from './endpoints/sw/show-registration.js';
import { createUnregisterProcedure } from './endpoints/sw/unregister.js';
import { createUpdateRegistrationProcedure } from './endpoints/sw/update-registration.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from './api.dependencies.js';
export function createNotificationsRouter(deps: NotificationsDependencies) {
	return implement(notificationsContract).$context<ApiContext<MiLocalUser>>().router({
		list: createListProcedure(deps),
		grouped: createGroupedProcedure(deps),
		create: createCreateProcedure(deps),
		flush: createFlushProcedure(deps),
		markAllAsRead: createMarkAllAsReadProcedure(deps),
		testNotification: createTestNotificationProcedure(deps),
		register: createRegisterProcedure(deps),
		showRegistration: createShowRegistrationProcedure(deps),
		unregister: createUnregisterProcedure(deps),
		updateRegistration: createUpdateRegistrationProcedure(deps),
	});
}
