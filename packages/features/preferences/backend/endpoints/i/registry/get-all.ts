/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedJsonValue } from '@features/users/backend/json-value.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryGetAllContract } from './get-all.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
import type { RegistryJsonValue } from './registry.schema.js';
export function createRegistryGetAllProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return createApiProcedure<Actor>()(registryGetAllContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			const items = await deps.registry.getAllItemsOfScope(principal.id, registryTenant(input.domain, token), input.scope);
			return Object.fromEntries(items.map((item): [
				string,
				RegistryJsonValue
			] => [item.key, toPackedJsonValue(item.value)]));
		});
}
