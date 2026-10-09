/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryRemoveContract } from './remove.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
export function createRegistryRemoveProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return implement(registryRemoveContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/remove', requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			return deps.registry.remove(principal.id, registryTenant(input.domain, token), input.scope, input.key);
		});
}
