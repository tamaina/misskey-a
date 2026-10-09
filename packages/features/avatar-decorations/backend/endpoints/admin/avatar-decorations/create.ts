/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationCreateDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'create'>;
	idService: Pick<AvatarDecorationsDependencies<Actor>['idService'], 'parse'>;
}
export function createAvatarDecorationCreateProcedure<Actor extends ApiActor>(deps: AvatarDecorationCreateDependencies<Actor>) {
	return implement(avatarDecorationsContract.create, { initialInputValidationIndex: Number.POSITIVE_INFINITY, initialOutputValidationIndex: Number.NaN }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: avatarDecorationsContract.create['~orpc'].meta.requestName, requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const row = await deps.avatarDecorationService.create({
				name: input.name, description: input.description, url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration, category: input.category,
			}, actor);
			return {
				id: row.id, createdAt: deps.idService.parse(row.id).date.toISOString(), updatedAt: null,
				name: row.name, description: row.description, url: row.url,
				roleIdsThatCanBeUsedThisDecoration: row.roleIdsThatCanBeUsedThisDecoration, category: row.category,
			};
		});
}
