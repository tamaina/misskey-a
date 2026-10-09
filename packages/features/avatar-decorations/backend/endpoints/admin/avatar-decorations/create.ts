/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationCreateDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'create'>;
	idService: Pick<AvatarDecorationsDependencies<Actor>['idService'], 'parse'>;
}
export function createAvatarDecorationCreateProcedure<Actor extends ApiActor>(deps: AvatarDecorationCreateDependencies<Actor>) {
	const procedure = createApiProcedure<Actor>();
	return procedure(avatarDecorationsContract.create, { requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'write:admin:avatar-decorations' })
		.use(requirePrincipal<Actor>())
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
