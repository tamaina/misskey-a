/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toRoleDto } from '../../role.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../api.definition.js';
import type { RolesDependencies } from '../../api.implementation.js';
export function createRolesListProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleEntityService'>) {
	return createApiProcedure<Actor>()(rolesContract.rolesList).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const roles = await deps.rolesRepository.findBy({
				isPublic: true,
				isExplorable: true,
			});
			return (await deps.roleEntityService.packMany(roles, me)).map(toRoleDto);
		});
}
