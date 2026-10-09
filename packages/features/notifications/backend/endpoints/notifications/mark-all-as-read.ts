/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { markAllAsReadContract } from './mark-all-as-read.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type MarkAllAsReadDependencies = Pick<NotificationsDependencies, 'readAllNotification'>;
export function createMarkAllAsReadProcedure(deps: MarkAllAsReadDependencies) {
	return implement(markAllAsReadContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: markAllAsReadContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:notifications' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			void deps.readAllNotification(actor.id, true);
		});
}
