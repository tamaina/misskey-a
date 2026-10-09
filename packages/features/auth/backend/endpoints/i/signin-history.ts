/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { SigninsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { SigninEntityService } from '../../serializers/SigninEntityService.js';
import * as v from 'valibot';
import { ISigninHistoryContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	requireCredential: true,
	secure: true,
} as const;
export interface ISigninHistoryDependencies {
	signinsRepository: SigninsRepository;
	signinEntityService: Pick<SigninEntityService, 'pack'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createISigninHistoryProcedure(deps: ISigninHistoryDependencies) {
	return implement(ISigninHistoryContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/signin-history', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const query = deps.queryService.makePaginationQuery(deps.signinsRepository.createQueryBuilder('signin'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('signin.userId = :meId', { meId: me.id });

			const history = await query.limit(ps.limit).getMany();

			return await Promise.all(history.map(record => deps.signinEntityService.pack(record)));
		})();
		return v.parse(requiredSchema(ISigninHistoryContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
