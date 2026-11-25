/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { BrowserSessionService } from '../../services/BrowserSessionService.js';
import { toPackedSignin } from '../../auth.schema.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { SigninsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { SigninEntityService } from '../../serializers/SigninEntityService.js';

import { ISigninHistoryContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface ISigninHistoryDependencies {
	signinsRepository: SigninsRepository;
	browserSessionService: Pick<BrowserSessionService, 'listOwned'>;
	signinEntityService: Pick<SigninEntityService, 'pack'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createISigninHistoryProcedure(deps: ISigninHistoryDependencies) {
	return createApiProcedure<MiLocalUser>()(ISigninHistoryContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const query = deps.queryService.makePaginationQuery(deps.signinsRepository.createQueryBuilder('signin'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('signin.userId = :meId', { meId: me.id });

			if (ps.browserSessionId) query.andWhere('signin.browserSessionId = :sessionId', { sessionId: ps.browserSessionId });
			if (ps.unlinkedOnly) query.andWhere('signin.browserSessionId IS NULL');

			// Collapse before cursor pagination, comparing against all owned signins (not just this page).
			if (ps.latestPerSession) query.andWhere(`NOT EXISTS (
				SELECT 1 FROM "signin" newer
				WHERE newer."userId" = signin."userId"
				AND newer."browserSessionId" = signin."browserSessionId"
				AND newer.id > signin.id
			)`);

			const history = await query.limit(ps.limit).getMany();

			const ids = [...new Set(history.flatMap(record => record.browserSessionId ? [record.browserSessionId] : []))];
			const sessions = ids.length ? await deps.browserSessionService.listOwned(me.id, ids.length, 0, ids) : [];
			const byId = new Map(sessions.map(session => [session.id, {
				id: session.id, createdAt: session.createdAt.toISOString(), lastUsedAt: session.lastUsedAt.toISOString(),
				lastIp: session.lastIp, lastUserAgent: session.lastUserAgent,
				revokedAt: session.revokedAt?.toISOString() ?? null, current: session.id === context.browserSession?.id,
			}]));
			return await Promise.all(history.map(async record => ({
				...await deps.signinEntityService.pack(record),
				browserSession: record.browserSessionId ? byId.get(record.browserSessionId) ?? null : null,
			})));
		})();
		return result.map(toPackedSignin);
	});
}
