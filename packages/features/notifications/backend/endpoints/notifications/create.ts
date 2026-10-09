/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { createContract } from './create.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.dependencies.js';
export type CreateDependencies = Pick<NotificationsDependencies, 'createAppNotification'>;
export function createCreateProcedure(deps: CreateDependencies) {
	return implement(createContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: createContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:notifications', limit: { duration: 60000, max: 10 } }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const token = context.token;
			deps.createAppNotification(actor.id, {
				appAccessTokenId: token?.id ?? null, customBody: input.body,
				customHeader: input.header ?? token?.name ?? null,
				customIcon: input.icon ?? token?.iconUrl ?? null,
			});
		});
}
