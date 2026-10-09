/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiError, internalError } from '../../api/backend/transport/orpc-error.js';
import type { InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import type { ApiActor, ApiContext, ApiToken } from '../../api/backend/transport/context.js';
import type { preferencesContract } from './api.contract.js';
import type { RegistryJsonValue } from './endpoints/i/registry/registry.schema.js';

type Inputs = { [K in keyof typeof preferencesContract]: InferSchemaOutput<NonNullable<(typeof preferencesContract)[K]['~orpc']['inputSchema']>> };
type Outputs = InferContractRouterOutputs<typeof preferencesContract>;
type RegistryValueType = Outputs['keysWithType'][string];

export type PreferencesOperations<Actor extends ApiActor> = {
	[K in keyof Inputs]: (input: Inputs[K], principal: Actor, token: ApiToken | null) => Promise<Outputs[K]>;
};
export type PreferencesContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { preferences: PreferencesOperations<Actor> };
};

export interface PreferencesRegistryItem {
	key: string;
	value: RegistryJsonValue;
	updatedAt: Date;
}
export interface PreferencesRegistry {
	getItem(userId: string, domain: string | null, scope: string[], key: string): Promise<PreferencesRegistryItem | null>;
	getAllItemsOfScope(userId: string, domain: string | null, scope: string[]): Promise<PreferencesRegistryItem[]>;
	getAllKeysOfScope(userId: string, domain: string | null, scope: string[]): Promise<string[]>;
	getAllScopeAndDomains(userId: string): Promise<{ domain: string | null; scopes: string[][] }[]>;
	remove(userId: string, domain: string | null, scope: string[], key: string): Promise<void>;
	set(userId: string, domain: string | null, scope: string[], key: string, value: RegistryJsonValue): Promise<void>;
}
export interface PreferencesDependencies { registry: PreferencesRegistry }

/** Access-token registries never fall back to a client-controlled domain. */
function registryTenant(domain: string | null | undefined, token: ApiToken | null): string | null {
	if (token === null) return domain ?? null;
	if (token.id === undefined || token.id.length === 0) throw apiError(internalError);
	return token.id;
}

function valueType(value: RegistryJsonValue): RegistryValueType {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'object';
}

export function createPreferencesOperations<Actor extends ApiActor>(deps: PreferencesDependencies): PreferencesOperations<Actor> {
	return {
		get: async (input, principal, token) => {
			const item = await deps.registry.getItem(principal.id, registryTenant(input.domain, token), input.scope, input.key);
			if (item === null) throw apiError({ message: 'No such key.', code: 'NO_SUCH_KEY', id: 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a' });
			return item.value;
		},
		getAll: async (input, principal, token) => {
			const items = await deps.registry.getAllItemsOfScope(principal.id, registryTenant(input.domain, token), input.scope);
			return Object.fromEntries(items.map((item): [string, RegistryJsonValue] => [item.key, item.value]));
		},
		getDetail: async (input, principal, token) => {
			const item = await deps.registry.getItem(principal.id, registryTenant(input.domain, token), input.scope, input.key);
			if (item === null) throw apiError({ message: 'No such key.', code: 'NO_SUCH_KEY', id: '97a1e8e7-c0f7-47d2-957a-92e61256e01a' });
			return { updatedAt: item.updatedAt.toISOString(), value: item.value };
		},
		keys: (input, principal, token) => deps.registry.getAllKeysOfScope(principal.id, registryTenant(input.domain, token), input.scope),
		keysWithType: async (input, principal, token) => {
			const items = await deps.registry.getAllItemsOfScope(principal.id, registryTenant(input.domain, token), input.scope);
			return Object.fromEntries(items.map((item): [string, RegistryValueType] => [item.key, valueType(item.value)]));
		},
		remove: (input, principal, token) => deps.registry.remove(principal.id, registryTenant(input.domain, token), input.scope, input.key),
		scopesWithDomain: (_input, principal) => deps.registry.getAllScopeAndDomains(principal.id),
		set: (input, principal, token) => deps.registry.set(principal.id, registryTenant(input.domain, token), input.scope, input.key, input.value),
	};
}
