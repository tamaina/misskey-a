/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { registryKeysWithTypeContract } from './keys-with-type.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PreferencesDependencies } from '../../../api.implementation.js';
import { registryTenant } from './registry.helpers.js';
import type { RegistryJsonValue } from './registry.schema.js';
type RegistryValueType = 'null' | 'array' | 'string' | 'number' | 'boolean' | 'object';

function valueType(value: RegistryJsonValue): RegistryValueType {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'object';
}

export function createRegistryKeysWithTypeProcedure<Actor extends ApiActor>(deps: PreferencesDependencies) {
	return implement(registryKeysWithTypeContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'i/registry/keys-with-type', requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const principal = context.principal;
			const token = context.token;
			const items = await deps.registry.getAllItemsOfScope(principal.id, registryTenant(input.domain, token), input.scope);
			return Object.fromEntries(items.map((item): [
				string,
				RegistryValueType
			] => [item.key, valueType(item.value)]));
		});
}
