/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { rolesContract } from '../../api.contract.js';
import type { RolesDependencies } from '../../api.dependencies.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { rolesErrors } from '../../api.errors.js';
export function createRolesShowProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'rolesRepository' | 'roleEntityService'>) {
	return implement(rolesContract.rolesShow, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'roles/show', requireCredential: false }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const role = await deps.rolesRepository.findOneBy({
				id: ps.roleId,
				isPublic: true,
			});
			if (role == null) {
				throw apiError(rolesErrors.rolesShow.noSuchRole);
			}
			return await deps.roleEntityService.pack(role, me);
		});
}
