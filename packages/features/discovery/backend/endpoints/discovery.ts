/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../api/backend/transport/middleware.js';
import { discoveryContract, type DiscoveryInputs, type DiscoveryOutputs } from './discovery.contract.js';

export type DiscoveryOperations<Actor extends ApiActor> = {
	[Name in keyof DiscoveryInputs]: (input: DiscoveryInputs[Name], actor: Name extends 'users/recommendation' ? Actor : Actor | null) => Promise<DiscoveryOutputs[Name]>;
};
export type DiscoveryContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { discovery: DiscoveryOperations<Actor> } };

export function createDiscoveryRouter<Actor extends ApiActor>() {
	const discovery = implement(discoveryContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<DiscoveryContext<Actor>>().use(authentication<Actor>());
	return discovery.router({
	'hashtags/list': discovery['hashtags/list'].use(apiPolicy<Actor>({ name: 'hashtags/list' })).handler(({ input, context }) => context.operations.discovery['hashtags/list'](input, context.principal)),
	'hashtags/search': discovery['hashtags/search'].use(apiPolicy<Actor>({ name: 'hashtags/search' })).handler(({ input, context }) => context.operations.discovery['hashtags/search'](input, context.principal)),
	'hashtags/show': discovery['hashtags/show'].use(apiPolicy<Actor>({ name: 'hashtags/show' })).handler(({ input, context }) => context.operations.discovery['hashtags/show'](input, context.principal)),
	'hashtags/trend': discovery['hashtags/trend'].use(apiPolicy<Actor>({ name: 'hashtags/trend' })).handler(({ input, context }) => context.operations.discovery['hashtags/trend'](input, context.principal)),
	'hashtags/trend:get': discovery['hashtags/trend:get'].use(apiPolicy<Actor>({ name: 'hashtags/trend' })).handler(({ input, context }) => context.operations.discovery['hashtags/trend'](input, context.principal)),
	'hashtags/users': discovery['hashtags/users'].use(apiPolicy<Actor>({ name: 'hashtags/users' })).handler(({ input, context }) => context.operations.discovery['hashtags/users'](input, context.principal)),
	'notes/featured': discovery['notes/featured'].use(apiPolicy<Actor>({ name: 'notes/featured' })).handler(({ input, context }) => context.operations.discovery['notes/featured'](input, context.principal)),
	'notes/featured:get': discovery['notes/featured:get'].use(apiPolicy<Actor>({ name: 'notes/featured' })).use(decodeScalarInput<Actor>({ limit: 'integer' })).handler(({ input, context }) => context.operations.discovery['notes/featured'](input, context.principal)),
	'notes/search-by-tag': discovery['notes/search-by-tag'].use(apiPolicy<Actor>({ name: 'notes/search-by-tag' })).handler(({ input, context }) => context.operations.discovery['notes/search-by-tag'](input, context.principal)),
	'users/featured-notes': discovery['users/featured-notes'].use(apiPolicy<Actor>({ name: 'users/featured-notes' })).handler(({ input, context }) => context.operations.discovery['users/featured-notes'](input, context.principal)),
	'users/featured-notes:get': discovery['users/featured-notes:get'].use(apiPolicy<Actor>({ name: 'users/featured-notes' })).use(decodeScalarInput<Actor>({ limit: 'integer' })).handler(({ input, context }) => context.operations.discovery['users/featured-notes'](input, context.principal)),
	'users/get-frequently-replied-users': discovery['users/get-frequently-replied-users'].use(apiPolicy<Actor>({ name: 'users/get-frequently-replied-users' })).handler(({ input, context }) => context.operations.discovery['users/get-frequently-replied-users'](input, context.principal)),
	'users/recommendation': discovery['users/recommendation'].use(apiPolicy<Actor>({ name: 'users/recommendation', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.discovery['users/recommendation'](input, context.principal)),
	'users/search': discovery['users/search'].use(apiPolicy<Actor>({ name: 'users/search', requiredRolePolicy: 'canSearchUsers' })).handler(({ input, context }) => context.operations.discovery['users/search'](input, context.principal)),
	'users/search-by-username-and-host': discovery['users/search-by-username-and-host'].use(apiPolicy<Actor>({ name: 'users/search-by-username-and-host' })).handler(({ input, context }) => context.operations.discovery['users/search-by-username-and-host'](input, context.principal)),
	});
}
