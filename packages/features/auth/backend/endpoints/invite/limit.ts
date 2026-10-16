/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { MoreThan } from 'typeorm';

import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { InviteLimitContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['meta'],

} as const;
export interface InviteLimitDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	roleService: Pick<RoleService, 'getUserPolicies'>;
	idService: Pick<IdService, 'gen'>;
}
export function createInviteLimitProcedure(deps: InviteLimitDependencies) {
	return createApiProcedure<MiLocalUser>()(InviteLimitContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const me = context.principal;
		const result = await (async () => {
			const policies = await deps.roleService.getUserPolicies(me.id);

			const count = policies.inviteLimit ? await deps.registrationTicketsRepository.countBy({
				id: MoreThan(deps.idService.gen(Date.now() - (policies.inviteLimitCycle * 60 * 1000))),
				createdById: me.id,
			}) : null;

			return {
				remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
			};
		})();
		return result;
	});
}
