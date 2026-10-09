/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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

			const history = await query.limit(ps.limit).getMany();

			return await Promise.all(history.map(record => deps.signinEntityService.pack(record)));
		})();
		return result.map(toPackedSignin);
	});
}
