/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';
export function createAdminShowModerationLogsProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'queryService' | 'moderationLogsRepository' | 'moderationLogEntityService'>) {
	return implement(moderationContract.adminShowModerationLogs, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/show-moderation-logs', requireCredential: true, requireAdmin: true, kind: 'read:admin:show-moderation-log' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'number', sinceDate: 'number', untilDate: 'number' }))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.moderationLogsRepository.createQueryBuilder('log'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			if (ps.type != null) {
				query.andWhere('log.type = :type', { type: ps.type });
			}
			if (ps.userId != null) {
				query.andWhere('log.userId = :userId', { userId: ps.userId });
			}
			if (ps.search != null) {
				const escapedSearch = sqlLikeEscape(ps.search);
				query.andWhere('log.info::text ILIKE :search', { search: `%${escapedSearch}%` });
			}
			const logs = await query.limit(ps.limit).getMany();
			return await deps.moderationLogEntityService.packMany(logs);
		});
}
