/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registrySetContract } from './set.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
export function createRegistrySetProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return createApiProcedure<Actor>()(registrySetContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			return deps.registry.set(principal.id, registryTenant(input.domain, token), input.scope, input.key, input.value);
		});
}
