/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registerContract } from './register.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export type RegisterDependencies = Pick<NotificationsDependencies, 'isValidEndpoint' | 'findSubscription' | 'getSwPublicKey' | 'insertSubscription' | 'generateId' | 'refreshSubscriptionCache'>;
export function createRegisterProcedure(deps: RegisterDependencies) {
	return implement(registerContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: registerContract['~orpc'].meta.requestName, requireCredential: true, secure: true }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			if (!deps.isValidEndpoint(input.endpoint)) throw apiError({ code: 'INVALID_ENDPOINT', message: 'Invalid push endpoint.', id: '4432adbe-17c0-4f9f-b43c-9ceb2f8910fe' });
			const existing = await deps.findSubscription({ userId: actor.id, endpoint: input.endpoint, auth: input.auth, publickey: input.publickey });
			if (existing) return { state: 'already-subscribed' as const, key: deps.getSwPublicKey(), userId: actor.id, endpoint: existing.endpoint, sendReadMessage: existing.sendReadMessage };
			await deps.insertSubscription({ id: deps.generateId(), userId: actor.id, ...input });
			deps.refreshSubscriptionCache(actor.id);
			return { state: 'subscribed' as const, key: deps.getSwPublicKey(), userId: actor.id, endpoint: input.endpoint, sendReadMessage: input.sendReadMessage };
		});
}
