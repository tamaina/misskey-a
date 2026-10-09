/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { avatarDecorationsContract } from '../../../api.definition.js';
import type { AvatarDecorationsDependencies } from '../../../api.implementation.js';
export interface AvatarDecorationListDependencies<Actor extends ApiActor> {
	avatarDecorationService: Pick<AvatarDecorationsDependencies<Actor>['avatarDecorationService'], 'getAll'>;
	idService: Pick<AvatarDecorationsDependencies<Actor>['idService'], 'parse'>;
}
export function createAvatarDecorationListProcedure<Actor extends ApiActor>(deps: AvatarDecorationListDependencies<Actor>) {
	return implement(avatarDecorationsContract.list, { initialInputValidationIndex: Number.POSITIVE_INFINITY, initialOutputValidationIndex: Number.NaN }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: avatarDecorationsContract.list['~orpc'].meta.requestName, requireCredential: true, requiredRolePolicy: 'canManageAvatarDecorations', kind: 'read:admin:avatar-decorations' })).use(requirePrincipal<Actor>())
		.handler(async () => {
			return (await deps.avatarDecorationService.getAll(true)).map(row => ({
				id: row.id, createdAt: deps.idService.parse(row.id).date.toISOString(), updatedAt: row.updatedAt?.toISOString() ?? null,
				name: row.name, description: row.description, url: row.url,
				roleIdsThatCanBeUsedThisDecoration: row.roleIdsThatCanBeUsedThisDecoration, category: row.category,
			}));
		});
}
