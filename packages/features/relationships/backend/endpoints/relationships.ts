/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import ms from 'ms';
import { authentication, apiPolicy, requirePrincipal } from '../../../api/backend/transport/middleware.js';
import { relationshipsContract, type RelationshipsInputs, type RelationshipsOutputs } from './relationships.contract.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';

type PublicRelationshipsRoute = 'users/followers' | 'users/following' | 'users/lists/get-memberships' | 'users/lists/list' | 'users/lists/show';
export type RelationshipsOperations<Actor extends ApiActor> = { [Name in keyof RelationshipsInputs]: (input: RelationshipsInputs[Name], actor: Name extends PublicRelationshipsRoute ? Actor | null : Actor) => Promise<RelationshipsOutputs[Name]> };
export type RelationshipsContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { relationships: RelationshipsOperations<Actor> } };

export function createRelationshipsRouter<Actor extends ApiActor>() {
	const relationships = implement(relationshipsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<RelationshipsContext<Actor>>().use(authentication<Actor>());
	return relationships.router({
		'blocking/create': relationships['blocking/create'].use(apiPolicy<Actor>({ name: 'blocking/create', requireCredential: true, kind: 'write:blocks', limit: {
			duration: ms('1hour'),
			max: 20,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['blocking/create'](input, context.principal)),
		'blocking/delete': relationships['blocking/delete'].use(apiPolicy<Actor>({ name: 'blocking/delete', requireCredential: true, kind: 'write:blocks', limit: {
			duration: ms('1hour'),
			max: 100,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['blocking/delete'](input, context.principal)),
		'blocking/list': relationships['blocking/list'].use(apiPolicy<Actor>({ name: 'blocking/list', requireCredential: true, kind: 'read:blocks' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['blocking/list'](input, context.principal)),
		'following/create': relationships['following/create'].use(apiPolicy<Actor>({ name: 'following/create', requireCredential: true, prohibitMoved: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/create'](input, context.principal)),
		'following/delete': relationships['following/delete'].use(apiPolicy<Actor>({ name: 'following/delete', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/delete'](input, context.principal)),
		'following/invalidate': relationships['following/invalidate'].use(apiPolicy<Actor>({ name: 'following/invalidate', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/invalidate'](input, context.principal)),
		'following/list': relationships['following/list'].use(apiPolicy<Actor>({ name: 'following/list', requireCredential: true, kind: 'read:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/list'](input, context.principal)),
		'following/requests/accept': relationships['following/requests/accept'].use(apiPolicy<Actor>({ name: 'following/requests/accept', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/requests/accept'](input, context.principal)),
		'following/requests/cancel': relationships['following/requests/cancel'].use(apiPolicy<Actor>({ name: 'following/requests/cancel', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/requests/cancel'](input, context.principal)),
		'following/requests/list': relationships['following/requests/list'].use(apiPolicy<Actor>({ name: 'following/requests/list', requireCredential: true, kind: 'read:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/requests/list'](input, context.principal)),
		'following/requests/reject': relationships['following/requests/reject'].use(apiPolicy<Actor>({ name: 'following/requests/reject', requireCredential: true, kind: 'write:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/requests/reject'](input, context.principal)),
		'following/requests/sent': relationships['following/requests/sent'].use(apiPolicy<Actor>({ name: 'following/requests/sent', requireCredential: true, kind: 'read:following' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/requests/sent'](input, context.principal)),
		'following/update': relationships['following/update'].use(apiPolicy<Actor>({ name: 'following/update', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 100,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/update'](input, context.principal)),
		'following/update-all': relationships['following/update-all'].use(apiPolicy<Actor>({ name: 'following/update-all', requireCredential: true, kind: 'write:following', limit: {
			duration: ms('1hour'),
			max: 10,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['following/update-all'](input, context.principal)),
		'mute/create': relationships['mute/create'].use(apiPolicy<Actor>({ name: 'mute/create', requireCredential: true, prohibitMoved: true, kind: 'write:mutes', limit: {
			duration: ms('1hour'),
			max: 20,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['mute/create'](input, context.principal)),
		'mute/delete': relationships['mute/delete'].use(apiPolicy<Actor>({ name: 'mute/delete', requireCredential: true, kind: 'write:mutes' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['mute/delete'](input, context.principal)),
		'mute/list': relationships['mute/list'].use(apiPolicy<Actor>({ name: 'mute/list', requireCredential: true, kind: 'read:mutes' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['mute/list'](input, context.principal)),
		'renote-mute/create': relationships['renote-mute/create'].use(apiPolicy<Actor>({ name: 'renote-mute/create', requireCredential: true, prohibitMoved: true, kind: 'write:mutes', limit: { duration: ms('1hour'), max: 20 } })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['renote-mute/create'](input, context.principal)),
		'renote-mute/delete': relationships['renote-mute/delete'].use(apiPolicy<Actor>({ name: 'renote-mute/delete', requireCredential: true, kind: 'write:mutes' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['renote-mute/delete'](input, context.principal)),
		'renote-mute/list': relationships['renote-mute/list'].use(apiPolicy<Actor>({ name: 'renote-mute/list', requireCredential: true, kind: 'read:mutes' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['renote-mute/list'](input, context.principal)),
		'users/followers': relationships['users/followers'].use(apiPolicy<Actor>({ name: 'users/followers', requireCredential: false })).handler(({ input, context }) => context.operations.relationships['users/followers'](input, context.principal)),
		'users/following': relationships['users/following'].use(apiPolicy<Actor>({ name: 'users/following', requireCredential: false })).handler(({ input, context }) => context.operations.relationships['users/following'](input, context.principal)),
		'users/get-following-users-by-birthday': relationships['users/get-following-users-by-birthday'].use(apiPolicy<Actor>({ name: 'users/get-following-users-by-birthday', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/get-following-users-by-birthday'](input, context.principal)),
		'users/lists/create': relationships['users/lists/create'].use(apiPolicy<Actor>({ name: 'users/lists/create', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/create'](input, context.principal)),
		'users/lists/create-from-public': relationships['users/lists/create-from-public'].use(apiPolicy<Actor>({ name: 'users/lists/create-from-public', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/create-from-public'](input, context.principal)),
		'users/lists/delete': relationships['users/lists/delete'].use(apiPolicy<Actor>({ name: 'users/lists/delete', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/delete'](input, context.principal)),
		'users/lists/favorite': relationships['users/lists/favorite'].use(apiPolicy<Actor>({ name: 'users/lists/favorite', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/favorite'](input, context.principal)),
		'users/lists/get-memberships': relationships['users/lists/get-memberships'].use(apiPolicy<Actor>({ name: 'users/lists/get-memberships', requireCredential: false, kind: 'read:account' })).handler(({ input, context }) => context.operations.relationships['users/lists/get-memberships'](input, context.principal)),
		'users/lists/list': relationships['users/lists/list'].use(apiPolicy<Actor>({ name: 'users/lists/list', requireCredential: false, kind: 'read:account' })).handler(({ input, context }) => context.operations.relationships['users/lists/list'](input, context.principal)),
		'users/lists/pull': relationships['users/lists/pull'].use(apiPolicy<Actor>({ name: 'users/lists/pull', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/pull'](input, context.principal)),
		'users/lists/push': relationships['users/lists/push'].use(apiPolicy<Actor>({ name: 'users/lists/push', requireCredential: true, prohibitMoved: true, kind: 'write:account', limit: {
			duration: ms('1hour'),
			max: 30,
		} })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/push'](input, context.principal)),
		'users/lists/show': relationships['users/lists/show'].use(apiPolicy<Actor>({ name: 'users/lists/show', requireCredential: false, kind: 'read:account' })).handler(({ input, context }) => context.operations.relationships['users/lists/show'](input, context.principal)),
		'users/lists/unfavorite': relationships['users/lists/unfavorite'].use(apiPolicy<Actor>({ name: 'users/lists/unfavorite', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/unfavorite'](input, context.principal)),
		'users/lists/update': relationships['users/lists/update'].use(apiPolicy<Actor>({ name: 'users/lists/update', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/update'](input, context.principal)),
		'users/lists/update-membership': relationships['users/lists/update-membership'].use(apiPolicy<Actor>({ name: 'users/lists/update-membership', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/lists/update-membership'](input, context.principal)),
		'users/relation': relationships['users/relation'].use(apiPolicy<Actor>({ name: 'users/relation', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).handler(({ input, context }) => context.operations.relationships['users/relation'](input, context.principal)),
	});
}
