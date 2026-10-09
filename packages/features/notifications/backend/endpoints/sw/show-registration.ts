/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { showRegistrationContract } from './show-registration.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type ShowRegistrationDependencies = Pick<NotificationsDependencies, 'findSubscription'>;
export function createShowRegistrationProcedure(deps: ShowRegistrationDependencies) {
	return implement(showRegistrationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: showRegistrationContract['~orpc'].meta.requestName, requireCredential: true, secure: true }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const record = await deps.findSubscription({ userId: actor.id, endpoint: input.endpoint });
			return record ? { userId: record.userId, endpoint: record.endpoint, sendReadMessage: record.sendReadMessage } : null;
		});
}
