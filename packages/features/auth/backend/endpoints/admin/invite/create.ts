/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedInviteCode } from '../../../auth.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../../serializers/InviteCodeEntityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { generateInviteCode } from '../../../utility/generate-invite-code.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { AdminInviteCreateContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['admin'],

	errors: {
		invalidDateTime: {
			message: 'Invalid date-time format',
			code: 'INVALID_DATE_TIME',
			id: 'f1380b15-3760-4c6c-a1db-5c3aaf1cbd49',
		},
	},
} as const;
export interface AdminInviteCreateDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	inviteCodeEntityService: Pick<InviteCodeEntityService, 'packMany'>;
	idService: Pick<IdService, 'gen'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminInviteCreateProcedure(deps: AdminInviteCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(AdminInviteCreateContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			if (ps.expiresAt && isNaN(Date.parse(ps.expiresAt))) {
				throw apiError(meta.errors.invalidDateTime);
			}

			const ticketsPromises = [];

			for (let i = 0; i < ps.count; i++) {
				ticketsPromises.push(deps.registrationTicketsRepository.insertOne({
					id: deps.idService.gen(),
					createdBy: me,
					createdById: me.id,
					expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
					code: generateInviteCode(),
				}));
			}

			const tickets = await Promise.all(ticketsPromises);

			deps.moderationLogService.log(me, 'createInvitation', {
				invitations: tickets,
			});

			return await deps.inviteCodeEntityService.packMany(tickets, me);
		})();
		return result.map(toPackedInviteCode);
	});
}
