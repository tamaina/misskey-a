/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { InviteDeleteContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['meta'],

	errors: {
		noSuchCode: {
			message: 'No such invite code.',
			code: 'NO_SUCH_INVITE_CODE',
			id: 'cd4f9ae4-7854-4e3e-8df9-c296f051e634',
		},

		cantDelete: {
			message: 'You can\'t delete this invite code.',
			code: 'CAN_NOT_DELETE_INVITE_CODE',
			id: 'ff17af39-000c-4d4e-abdf-848fa30fc1ce',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121',
		},
	},
} as const;
export interface InviteDeleteDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createInviteDeleteProcedure(deps: InviteDeleteDependencies) {
	return createApiProcedure<MiLocalUser>()(InviteDeleteContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const ticket = await deps.registrationTicketsRepository.findOneBy({ id: ps.inviteId });
			const isModerator = await deps.roleService.isModerator(me);

			if (ticket == null) {
				throw apiError(meta.errors.noSuchCode);
			}

			if (ticket.createdById !== me.id && !isModerator) {
				throw apiError(meta.errors.accessDenied);
			}

			if (ticket.usedAt && !isModerator) {
				throw apiError(meta.errors.cantDelete);
			}

			await deps.registrationTicketsRepository.delete(ticket.id);
		})();
		return result;
	});
}
