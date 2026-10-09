/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.contract.js';
import type { RolesDependencies } from '../../../api.dependencies.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../../api.errors.js';
export function createAdminRolesAssignProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleService' | 'usersRepository'>) {
	return implement(rolesContract.adminRolesAssign, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/roles/assign', requireCredential: true, requireModerator: true, kind: 'write:admin:roles' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ expiresAt: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw apiError(rolesErrors.adminRolesAssign.noSuchRole);
			}
			if (!role.canEditMembersByModerator && !(await deps.roleService.isAdministrator(me))) {
				throw apiError(rolesErrors.adminRolesAssign.accessDenied);
			}
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw apiError(rolesErrors.adminRolesAssign.noSuchUser);
			}
			if (ps.expiresAt && ps.expiresAt <= Date.now()) {
				return;
			}
			await deps.roleService.assign(user.id, role.id, ps.expiresAt ? new Date(ps.expiresAt) : null, me);
		});
}
