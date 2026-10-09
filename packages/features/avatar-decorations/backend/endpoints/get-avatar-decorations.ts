/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { avatarDecorationsContract } from '../api.contract.js';
import type { AvatarDecorationsDependencies } from '../api.dependencies.js';
export interface GetAvatarDecorationsDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'getAll'>;
	readRoles: AvatarDecorationsDependencies<Actor>['readRoles'];
}
export function createGetAvatarDecorationsProcedure<Actor extends ApiActor>(deps: GetAvatarDecorationsDependencies<Actor>) {
	return implement(avatarDecorationsContract.get, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: avatarDecorationsContract.get['~orpc'].meta.requestName }))
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
