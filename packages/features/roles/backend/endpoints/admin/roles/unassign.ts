/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../../api.errors.js';
export function createAdminRolesUnassignProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleService' | 'usersRepository'>) {
	return implement(rolesContract.adminRolesUnassign, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/roles/unassign', requireCredential: true, requireModerator: true, kind: 'write:admin:roles' })).use(requirePrincipal<Actor>())
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
