/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { avatarDecorationsContract } from '../api.definition.js';
import type { AvatarDecorationsDependencies } from '../api.implementation.js';
export interface GetAvatarDecorationsDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'getAll'>;
	readRoles: AvatarDecorationsDependencies<Actor>['readRoles'];
}
export function createGetAvatarDecorationsProcedure<Actor extends ApiActor>(deps: GetAvatarDecorationsDependencies<Actor>) {
	return createApiProcedure<Actor>()(avatarDecorationsContract.get)
		.handler(async ({ context }) => {
			const actor = context.principal;
			const decorations = await deps.avatarDecorationService.getAll(true);
			const roles = await deps.readRoles();
			const visibleRoleIds = new Set(roles.filter(role => actor !== null || role.isPublic).map(role => role.id));
			return decorations.map(row => ({
				id: row.id, name: row.name, description: row.description, url: row.url,
				roleIdsThatCanBeUsedThisDecoration: row.roleIdsThatCanBeUsedThisDecoration.filter(id => visibleRoleIds.has(id)),
				category: row.category,
			}));
		});
}
