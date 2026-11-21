/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedInviteCode } from '../../auth.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { RegistrationTicketsRepository } from '@features/persistence/backend/repositories/models.js';
import { InviteCodeEntityService } from '../../serializers/InviteCodeEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';

import { InviteListContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['meta'],

} as const;
export interface InviteListDependencies {
	registrationTicketsRepository: RegistrationTicketsRepository;
	inviteCodeEntityService: Pick<InviteCodeEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createInviteListProcedure(deps: InviteListDependencies) {
	return createApiProcedure<MiLocalUser>()(InviteListContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const query = deps.queryService.makePaginationQuery(deps.registrationTicketsRepository.createQueryBuilder('ticket'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('ticket.createdById = :meId', { meId: me.id })
				.leftJoinAndSelect('ticket.createdBy', 'createdBy')
				.leftJoinAndSelect('ticket.usedBy', 'usedBy');

			const tickets = await query
				.limit(ps.limit)
				.getMany();

			return await deps.inviteCodeEntityService.packMany(tickets, me);
		})();
		return result.map(toPackedInviteCode);
	});
}
