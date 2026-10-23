/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { unregisterContract } from './unregister.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type UnregisterDependencies = Pick<NotificationsDependencies, 'findSubscriptions' | 'deleteSubscriptions' | 'refreshSubscriptionCache'>;
export function createUnregisterProcedure(deps: UnregisterDependencies) {
	return createApiProcedure<MiLocalUser>()(unregisterContract)
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const records = await deps.findSubscriptions({ ...(actor ? { userId: actor.id } : {}), ...input });
			if (records.length === 0) return;
			await deps.deleteSubscriptions(records.map(record => record.id));
			for (const userId of new Set(records.map(record => record.userId))) deps.refreshSubscriptionCache(userId);
		});
}
