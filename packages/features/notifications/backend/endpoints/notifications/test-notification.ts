/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { testNotificationContract } from './test-notification.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type TestNotificationDependencies = Pick<NotificationsDependencies, 'createTestNotification'>;
export function createTestNotificationProcedure(deps: TestNotificationDependencies) {
	return createApiProcedure<MiLocalUser>()(testNotificationContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			deps.createTestNotification(actor.id);
		});
}
