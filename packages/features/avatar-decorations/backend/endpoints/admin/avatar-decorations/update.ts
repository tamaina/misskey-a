/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationUpdateDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'update'>;
}
export function createAvatarDecorationUpdateProcedure<Actor extends ApiActor>(deps: AvatarDecorationUpdateDependencies<Actor>) {
	return createApiProcedure<Actor>()(avatarDecorationsContract.update)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.avatarDecorationService.update(input.id, {
				name: input.name, description: input.description, url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration, category: input.category,
			}, actor);
		});
}
