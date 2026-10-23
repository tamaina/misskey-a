/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { createContract } from './create.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotificationsDependencies } from '@features/notifications/backend/api.implementation.js';
export type CreateDependencies = Pick<NotificationsDependencies, 'createAppNotification'>;
export function createCreateProcedure(deps: CreateDependencies) {
	return createApiProcedure<MiLocalUser>()(createContract)
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
