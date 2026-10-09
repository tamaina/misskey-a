/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { unregisterContract } from './unregister.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.dependencies.js';
export type UnregisterDependencies = Pick<NotificationsDependencies, 'findSubscriptions' | 'deleteSubscriptions' | 'refreshSubscriptionCache'>;
export function createUnregisterProcedure(deps: UnregisterDependencies) {
	return implement(unregisterContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: unregisterContract['~orpc'].meta.requestName, limit: { duration: 3600000, max: 30 } }))
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const records = await deps.findSubscriptions({ ...(actor ? { userId: actor.id } : {}), ...input });
			if (records.length === 0) return;
			await deps.deleteSubscriptions(records.map(record => record.id));
			for (const userId of new Set(records.map(record => record.userId))) deps.refreshSubscriptionCache(userId);
		});
}
