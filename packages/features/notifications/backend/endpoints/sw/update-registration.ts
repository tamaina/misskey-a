/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { updateRegistrationContract } from './update-registration.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export type UpdateRegistrationDependencies = Pick<NotificationsDependencies, 'findSubscription' | 'updateSubscription' | 'refreshSubscriptionCache'>;
export function createUpdateRegistrationProcedure(deps: UpdateRegistrationDependencies) {
	return implement(updateRegistrationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: updateRegistrationContract['~orpc'].meta.requestName, requireCredential: true, secure: true }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const record = await deps.findSubscription({ userId: actor.id, endpoint: input.endpoint });
			if (record === null) throw apiError({ code: 'NO_SUCH_REGISTRATION', message: 'No such registration.', id: ' b09d8066-8064-5613-efb6-0e963b21d012' });
			if (input.sendReadMessage !== undefined) record.sendReadMessage = input.sendReadMessage;
			await deps.updateSubscription(record.id, { sendReadMessage: record.sendReadMessage });
			deps.refreshSubscriptionCache(actor.id);
			return { userId: record.userId, endpoint: record.endpoint, sendReadMessage: record.sendReadMessage };
		});
}
