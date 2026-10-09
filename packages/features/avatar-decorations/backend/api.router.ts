/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../api/backend/transport/middleware.js';
import { avatarDecorationsContract } from './api.contract.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { AvatarDecorationsOperations } from './api.operations.js';

export type AvatarDecorationsContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { avatarDecorations: AvatarDecorationsOperations<Actor> };
};

export function createAvatarDecorationsRouter<Actor extends ApiActor>() {
	const api = implement(avatarDecorationsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AvatarDecorationsContext<Actor>>().use(authentication<Actor>());
	return api.router({
		create: api.create.use(apiPolicy<Actor>({ name: 'admin/avatar-decorations/create', requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.avatarDecorations.create(input, context.principal)),
		delete: api.delete.use(apiPolicy<Actor>({ name: 'admin/avatar-decorations/delete', requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.avatarDecorations.delete(input, context.principal)),
		list: api.list.use(apiPolicy<Actor>({ name: 'admin/avatar-decorations/list', requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'read:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.avatarDecorations.list(input, context.principal)),
		update: api.update.use(apiPolicy<Actor>({ name: 'admin/avatar-decorations/update', requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.avatarDecorations.update(input, context.principal)),
		get: api.get.use(apiPolicy<Actor>({ name: 'get-avatar-decorations' }))
			.handler(({ input, context }) => context.operations.avatarDecorations.get(input, context.principal)),
	});
}
