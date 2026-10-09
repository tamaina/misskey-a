/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryGetDetailContract } from './get-detail.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export function createRegistryGetDetailProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return implement(registryGetDetailContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/get-detail', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			const item = await deps.registry.getItem(principal.id, registryTenant(input.domain, token), input.scope, input.key);
			if (item === null) throw apiError({ message: 'No such key.', code: 'NO_SUCH_KEY', id: '97a1e8e7-c0f7-47d2-957a-92e61256e01a' });
			return { updatedAt: item.updatedAt.toISOString(), value: item.value };
		});
}
