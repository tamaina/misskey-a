/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AppsRepository, AccessTokensRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { AuthSessionUserkeyContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'fcab192a-2c5a-43b7-8ad8-9b7054d8d40d',
		},

		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '5b5a1503-8bc8-4bd0-8054-dc189e8cdcb3',
		},

		pendingSession: {
			message: 'This session is not completed yet.',
			code: 'PENDING_SESSION',
			id: '8c8a4145-02cc-4cca-8e66-29ba60445a8e',
		},
	},
} as const;
export interface AuthSessionUserkeyDependencies {
	appsRepository: AppsRepository;
	authSessionsRepository: AuthSessionsRepository;
	accessTokensRepository: AccessTokensRepository;
	userEntityService: Pick<UserEntityService, 'pack'>;
}
export function createAuthSessionUserkeyProcedure(deps: AuthSessionUserkeyDependencies) {
	return implement(AuthSessionUserkeyContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'auth/session/userkey' })).handler(async ({ input, context }) => {
		const ps = input;
		const result = await (async () => {
			// Lookup app
			const app = await deps.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw apiError(meta.errors.noSuchApp);
			}

			// Fetch token
			const session = await deps.authSessionsRepository.findOneBy({
				token: ps.token,
				appId: app.id,
			});

			if (session == null) {
				throw apiError(meta.errors.noSuchSession);
			}

			if (session.userId == null) {
				throw apiError(meta.errors.pendingSession);
			}

			// Lookup access token
			const accessToken = await deps.accessTokensRepository.findOneByOrFail({
				appId: app.id,
				userId: session.userId,
			});

			// Delete session
			deps.authSessionsRepository.delete(session.id);

			return {
				accessToken: accessToken.token,
				user: await deps.userEntityService.pack(session.userId, null, {
					schema: 'UserDetailedNotMe',
				}),
			};
		})();
		return v.parse(requiredSchema(AuthSessionUserkeyContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
