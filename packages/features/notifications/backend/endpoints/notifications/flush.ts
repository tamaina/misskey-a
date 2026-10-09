/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { flushContract } from './flush.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type FlushDependencies = Pick<NotificationsDependencies, 'flushAllNotifications'>;
export function createFlushProcedure(deps: FlushDependencies) {
	return createApiProcedure<MiLocalUser>()(flushContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			void deps.flushAllNotifications(actor.id);
		});
}
