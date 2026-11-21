/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { markAllAsReadContract } from './mark-all-as-read.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type MarkAllAsReadDependencies = Pick<NotificationsDependencies, 'readAllNotification'>;
export function createMarkAllAsReadProcedure(deps: MarkAllAsReadDependencies) {
	return createApiProcedure<MiLocalUser>()(markAllAsReadContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			void deps.readAllNotification(actor.id, true);
		});
}
