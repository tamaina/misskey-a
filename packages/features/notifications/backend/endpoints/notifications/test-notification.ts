/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { testNotificationContract } from './test-notification.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.dependencies.js';
export type TestNotificationDependencies = Pick<NotificationsDependencies, 'createTestNotification'>;
export function createTestNotificationProcedure(deps: TestNotificationDependencies) {
	return implement(testNotificationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: testNotificationContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:notifications', limit: { duration: 60000, max: 10 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			deps.createTestNotification(actor.id);
		});
}
