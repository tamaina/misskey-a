/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { NotificationsContext } from './operations.js';
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

export function createNotificationsRouter<Actor extends ApiActor>() {
	return implement(notificationsContract).$context<NotificationsContext<Actor>>().router({
		list: createListProcedure<Actor>(),
		grouped: createGroupedProcedure<Actor>(),
		create: createCreateProcedure<Actor>(),
		flush: createFlushProcedure<Actor>(),
		markAllAsRead: createMarkAllAsReadProcedure<Actor>(),
		testNotification: createTestNotificationProcedure<Actor>(),
		register: createRegisterProcedure<Actor>(),
		showRegistration: createShowRegistrationProcedure<Actor>(),
		unregister: createUnregisterProcedure<Actor>(),
		updateRegistration: createUpdateRegistrationProcedure<Actor>(),
	});
}
