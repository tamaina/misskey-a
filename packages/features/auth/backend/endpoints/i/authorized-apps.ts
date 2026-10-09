/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IsNull, Not } from 'typeorm';

import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import * as v from 'valibot';
import { IAuthorizedAppsContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	requireCredential: true,

	secure: true,
} as const;
export interface IAuthorizedAppsDependencies {
	accessTokensRepository: AccessTokensRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
}
export function createIAuthorizedAppsProcedure(deps: IAuthorizedAppsDependencies) {
	return implement(IAuthorizedAppsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/authorized-apps', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			// Get tokens
			const tokens = await deps.accessTokensRepository.find({
				where: {
					userId: me.id,
					appId: Not(IsNull()),
				},
				take: ps.limit,
				skip: ps.offset,
				order: {
					id: ps.sort === 'asc' ? 1 : -1,
				},
			});

			return await Promise.all(tokens.map(token => deps.appEntityService.pack(token.appId!, me, {
				detail: true,
			})));
		})();
		return v.parse(requiredSchema(IAuthorizedAppsContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
