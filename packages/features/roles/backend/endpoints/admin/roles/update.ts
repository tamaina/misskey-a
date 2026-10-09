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
export function createAdminRolesUpdateProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleService'>) {
	return implement(rolesContract.adminRolesUpdate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/roles/update', requireCredential: true, requireAdmin: true, kind: 'write:admin:roles' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isPublic: 'boolean', isModerator: 'boolean', isAdministrator: 'boolean', isExplorable: 'boolean', asBadge: 'boolean', preserveAssignmentOnMoveAccount: 'boolean', canEditMembersByModerator: 'boolean', displayOrder: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw apiError(rolesErrors.adminRolesUpdate.noSuchRole);
			}
			await deps.roleService.update(role, {
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isModerator: ps.isModerator,
				isAdministrator: ps.isAdministrator,
				isExplorable: ps.isExplorable,
				asBadge: ps.asBadge,
				preserveAssignmentOnMoveAccount: ps.preserveAssignmentOnMoveAccount,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}, me);
		});
}
