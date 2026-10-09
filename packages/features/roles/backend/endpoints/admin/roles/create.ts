/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toRoleDto } from '../../../role.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
export function createAdminRolesCreateProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'roleService' | 'roleEntityService'>) {
	return createApiProcedure<Actor>()(rolesContract.adminRolesCreate).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isPublic: 'boolean', isModerator: 'boolean', isAdministrator: 'boolean', isExplorable: 'boolean', asBadge: 'boolean', preserveAssignmentOnMoveAccount: 'boolean', canEditMembersByModerator: 'boolean' })).use(decodeScalarInput<Actor>({ displayOrder: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const created = await deps.roleService.create(ps, me);
			return toRoleDto(await deps.roleEntityService.pack(created, me));
		});
}
