/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { IsNull, Not } from 'typeorm';

import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';

import { IAuthorizedAppsContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface IAuthorizedAppsDependencies {
	accessTokensRepository: AccessTokensRepository;
	appEntityService: Pick<AppEntityService, 'pack'>;
}
export function createIAuthorizedAppsProcedure(deps: IAuthorizedAppsDependencies) {
	return createApiProcedure<MiLocalUser>()(IAuthorizedAppsContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
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
		return result.map(app => ({ id: app.id, name: app.name, callbackUrl: app.callbackUrl, permission: [...app.permission], ...(app.isAuthorized === undefined ? {} : { isAuthorized: app.isAuthorized }) }));
	});
}
