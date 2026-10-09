/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationDeleteDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'delete'>;
}
export function createAvatarDecorationDeleteProcedure<Actor extends ApiActor>(deps: AvatarDecorationDeleteDependencies<Actor>) {
	return implement(avatarDecorationsContract.delete, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: avatarDecorationsContract.delete['~orpc'].meta.requestName, requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.avatarDecorationService.delete(input.id, actor);
		});
}
