/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { AppsRepository, AccessTokensRepository, AuthSessionsRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import { AuthSessionUserkeyContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['auth'],

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
	return createApiProcedure<MiLocalUser>()(AuthSessionUserkeyContract).handler(async ({ input, context }) => {
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
		return { accessToken: result.accessToken, user: toPackedUserDetailed(result.user) };
	});
}
