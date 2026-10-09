/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import * as v from 'valibot';
import { MiauthGenTokenContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,
} as const;
export interface MiauthGenTokenDependencies {
	accessTokensRepository: AccessTokensRepository;
	idService: Pick<IdService, 'gen'>;
	notificationService: Pick<NotificationService, 'createNotification'>;
}
export function createMiauthGenTokenProcedure(deps: MiauthGenTokenDependencies) {
	return implement(MiauthGenTokenContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'miauth/gen-token', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			// Generate access token
			const accessToken = secureRndstr(32);

			const now = new Date();

			// Insert access token doc
			await deps.accessTokensRepository.insert({
				id: deps.idService.gen(now.getTime()),
				lastUsedAt: now,
				session: ps.session,
				userId: me.id,
				token: accessToken,
				hash: accessToken,
				name: ps.name,
				description: ps.description,
				iconUrl: ps.iconUrl,
				permission: ps.permission,
			});

			// アクセストークンが生成されたことを通知
			deps.notificationService.createNotification(me.id, 'createToken', {});

			return {
				token: accessToken,
			};
		})();
		return v.parse(requiredSchema(MiauthGenTokenContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
