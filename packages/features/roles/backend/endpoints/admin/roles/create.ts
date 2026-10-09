/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { rolesContract } from '../../../api.definition.js';
import type { RolesDependencies } from '../../../api.implementation.js';
export function createAdminRolesCreateProcedure<Actor extends ApiActor>(deps: Pick<RolesDependencies<Actor>, 'roleService' | 'roleEntityService'>) {
	return implement(rolesContract.adminRolesCreate, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/roles/create', requireCredential: true, requireAdmin: true, kind: 'write:admin:roles' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isPublic: 'boolean', isModerator: 'boolean', isAdministrator: 'boolean', isExplorable: 'boolean', asBadge: 'boolean', preserveAssignmentOnMoveAccount: 'boolean', canEditMembersByModerator: 'boolean' })).use(decodeScalarInput<Actor>({ displayOrder: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const created = await deps.roleService.create(ps, me);
			return await deps.roleEntityService.pack(created, me);
		});
}
