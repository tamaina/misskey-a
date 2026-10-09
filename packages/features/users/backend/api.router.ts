/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../api/backend/transport/middleware.js';
import { usersContract, type UsersInputs, type UsersOutputs } from './api.contract.js';
import type { ApiActor, ApiContext, ApiToken } from '../../api/backend/transport/context.js';
export type UsersOperations<Actor extends ApiActor> = {
	[Name in keyof UsersInputs]: (input: UsersInputs[Name], actor: Name extends 'users' | 'users/show' | 'users/achievements' ? Actor | null : Actor, token: ApiToken | null, ip: string) => Promise<UsersOutputs[Name]>;
};
export type UsersContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { users: UsersOperations<Actor> } };
export function createUsersRouter<Actor extends ApiActor>() {
	const api = implement(usersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<UsersContext<Actor>>().use(authentication<Actor>());
	return api.router({
		'admin/accounts/delete': api['admin/accounts/delete'].use(apiPolicy<Actor>({ name: 'admin/accounts/delete', requireCredential: true, requireAdmin: true, kind: 'write:admin:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['admin/accounts/delete'](input, context.principal, context.token, context.ip)),
		'admin/accounts/find-by-email': api['admin/accounts/find-by-email'].use(apiPolicy<Actor>({ name: 'admin/accounts/find-by-email', requireCredential: true, requireAdmin: true, kind: 'read:admin:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['admin/accounts/find-by-email'](input, context.principal, context.token, context.ip)),
		'admin/delete-account': api['admin/delete-account'].use(apiPolicy<Actor>({ name: 'admin/delete-account', requireCredential: true, requireAdmin: true, kind: 'write:admin:delete-account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['admin/delete-account'](input, context.principal, context.token, context.ip)),
		'admin/update-proxy-account': api['admin/update-proxy-account'].use(apiPolicy<Actor>({ name: 'admin/update-proxy-account', requireCredential: true, requireModerator: true, kind: 'write:admin:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['admin/update-proxy-account'](input, context.principal, context.token, context.ip)),
		'i': api['i'].use(apiPolicy<Actor>({ name: 'i', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['i'](input, context.principal, context.token, context.ip)),
		'i/claim-achievement': api['i/claim-achievement'].use(apiPolicy<Actor>({ name: 'i/claim-achievement', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['i/claim-achievement'](input, context.principal, context.token, context.ip)),
		'i/delete-account': api['i/delete-account'].use(apiPolicy<Actor>({ name: 'i/delete-account', requireCredential: true, secure: true })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['i/delete-account'](input, context.principal, context.token, context.ip)),
		'i/move': api['i/move'].use(apiPolicy<Actor>({ name: 'i/move', requireCredential: true, secure: true, prohibitMoved: true, limit: {
			duration: 86400000,
			max: 5,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['i/move'](input, context.principal, context.token, context.ip)),
		'i/update': api['i/update'].use(apiPolicy<Actor>({ name: 'i/update', requireCredential: true, kind: 'write:account', limit: {
			duration: 3600000,
			max: 20,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['i/update'](input, context.principal, context.token, context.ip)),
		'users': api['users'].use(apiPolicy<Actor>({ name: 'users' })).handler(({ input, context }) => context.operations.users['users'](input, context.principal, context.token, context.ip)),
		'users/achievements': api['users/achievements'].use(apiPolicy<Actor>({ name: 'users/achievements' })).handler(({ input, context }) => context.operations.users['users/achievements'](input, context.principal, context.token, context.ip)),
		'users/show': api['users/show'].use(apiPolicy<Actor>({ name: 'users/show' })).handler(({ input, context }) => context.operations.users['users/show'](input, context.principal, context.token, context.ip)),
		'users/update-memo': api['users/update-memo'].use(apiPolicy<Actor>({ name: 'users/update-memo', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.users['users/update-memo'](input, context.principal, context.token, context.ip)),
	});
}
