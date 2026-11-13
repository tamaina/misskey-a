/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../../api.errors.js';
export function createAdminRolesUnassignProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleService' | 'usersRepository'>) {
	return createApiProcedure<Actor>()(rolesContract.adminRolesUnassign).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw apiError(rolesErrors.adminRolesUnassign.noSuchRole);
			}
			if (!role.canEditMembersByModerator && !(await deps.roleService.isAdministrator(me))) {
				throw apiError(rolesErrors.adminRolesUnassign.accessDenied);
			}
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw apiError(rolesErrors.adminRolesUnassign.noSuchUser);
			}
			await deps.roleService.unassign(user.id, role.id, me);
		});
}
