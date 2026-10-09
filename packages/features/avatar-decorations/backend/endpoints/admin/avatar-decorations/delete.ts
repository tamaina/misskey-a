/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationDeleteDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'delete'>;
}
export function createAvatarDecorationDeleteProcedure<Actor extends ApiActor>(deps: AvatarDecorationDeleteDependencies<Actor>) {
	return createApiProcedure<Actor>()(avatarDecorationsContract.delete)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.avatarDecorationService.delete(input.id, actor);
		});
}
