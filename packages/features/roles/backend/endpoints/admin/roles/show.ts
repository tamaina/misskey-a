/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toRoleDto } from '../../../role.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../../api.errors.js';
export function createAdminRolesShowProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleEntityService'>) {
	return createApiProcedure<Actor>()(rolesContract.adminRolesShow).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw apiError(rolesErrors.adminRolesShow.noSuchRole);
			}
			return toRoleDto(await deps.roleEntityService.pack(role, me));
		});
}
