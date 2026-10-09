/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedInviteCode } from '../../auth.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { MoreThan } from 'typeorm';
import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { generateInviteCode } from '../../utility/generate-invite-code.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { InviteCreateContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['meta'],

	errors: {
		exceededCreateLimit: {
			message: 'You have exceeded the limit for creating an invitation code.',
			code: 'EXCEEDED_LIMIT_OF_CREATE_INVITE_CODE',
			id: '8b165dd3-6f37-4557-8db1-73175d63c641',
		},
	},
} as const;
export interface InviteCreateDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	inviteCodeEntityService: Pick<InviteCodeEntityService, 'pack'>;
	idService: Pick<IdService, 'gen'>;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}
export function createInviteCreateProcedure(deps: InviteCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(InviteCreateContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const me = context.principal;
		const result = await (async () => {
			const policies = await deps.roleService.getUserPolicies(me.id);

			if (policies.inviteLimit) {
				const count = await deps.registrationTicketsRepository.countBy({
					id: MoreThan(deps.idService.gen(Date.now() - (policies.inviteLimitCycle * 1000 * 60))),
					createdById: me.id,
				});

				if (count >= policies.inviteLimit) {
					throw apiError(meta.errors.exceededCreateLimit);
				}
			}

			const ticket = await deps.registrationTicketsRepository.insertOne({
				id: deps.idService.gen(),
				createdBy: me,
				createdById: me.id,
				expiresAt: policies.inviteExpirationTime ? new Date(Date.now() + (policies.inviteExpirationTime * 1000 * 60)) : null,
				code: generateInviteCode(),
			});

			return await deps.inviteCodeEntityService.pack(ticket, me);
		})();
		return toPackedInviteCode(result);
	});
}
