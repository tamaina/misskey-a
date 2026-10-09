/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../../api.errors.js';
export function createAdminRolesUpdateProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleService'>) {
	return createApiProcedure<Actor>()(rolesContract.adminRolesUpdate).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isPublic: 'boolean', isModerator: 'boolean', isAdministrator: 'boolean', isExplorable: 'boolean', asBadge: 'boolean', preserveAssignmentOnMoveAccount: 'boolean', canEditMembersByModerator: 'boolean', displayOrder: 'number' }))
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
