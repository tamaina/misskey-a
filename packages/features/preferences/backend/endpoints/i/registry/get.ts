/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedJsonValue } from '@features/users/backend/json-value.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryGetContract } from './get.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export function createRegistryGetProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return createApiProcedure<Actor>()(registryGetContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			const item = await deps.registry.getItem(principal.id, registryTenant(input.domain, token), input.scope, input.key);
			if (item === null) throw apiError({ message: 'No such key.', code: 'NO_SUCH_KEY', id: 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a' });
			return toPackedJsonValue(item.value);
		});
}
