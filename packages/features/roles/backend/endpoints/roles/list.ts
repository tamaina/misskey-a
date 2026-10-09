/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../api.definition.js';
import type { RolesDependencies } from '../../api.implementation.js';
export function createRolesListProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleEntityService'>) {
	return implement(rolesContract.rolesList, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'roles/list', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const roles = await deps.rolesRepository.findBy({
				isPublic: true,
				isExplorable: true,
			});
			return await deps.roleEntityService.packMany(roles, me);
		});
}
