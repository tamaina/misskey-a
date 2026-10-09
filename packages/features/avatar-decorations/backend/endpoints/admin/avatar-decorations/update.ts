/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationUpdateDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'update'>;
}
export function createAvatarDecorationUpdateProcedure<Actor extends ApiActor>(deps: AvatarDecorationUpdateDependencies<Actor>) {
	return implement(avatarDecorationsContract.update, { initialInputValidationIndex: Number.POSITIVE_INFINITY, initialOutputValidationIndex: Number.NaN }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: avatarDecorationsContract.update['~orpc'].meta.requestName, requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.avatarDecorationService.update(input.id, {
				name: input.name, description: input.description, url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration, category: input.category,
			}, actor);
		});
}
