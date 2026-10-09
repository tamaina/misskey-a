/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import type { AuthSessionsRepository, AppsRepository, AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import { AuthAcceptContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '9c72d8de-391a-43c1-9d06-08d29efde8df',
		},
	},
} as const;
export interface AuthAcceptDependencies {
	appsRepository: AppsRepository;
	authSessionsRepository: AuthSessionsRepository;
	accessTokensRepository: AccessTokensRepository;
	idService: Pick<IdService, 'gen'>;
}
export function createAuthAcceptProcedure(deps: AuthAcceptDependencies) {
	return implement(AuthAcceptContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'auth/accept', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			// Fetch token
			const session = await deps.authSessionsRepository
				.findOneBy({ token: ps.token });

			if (session == null) {
				throw apiError(meta.errors.noSuchSession);
			}

			const accessToken = secureRndstr(32);

			// Fetch exist access token
			const exist = await deps.accessTokensRepository.exists({
				where: {
					appId: session.appId,
					userId: me.id,
				},
			});

			if (!exist) {
				const app = await deps.appsRepository.findOneByOrFail({ id: session.appId });

				// Generate Hash
				const sha256 = crypto.createHash('sha256');
				sha256.update(accessToken + app.secret);
				const hash = sha256.digest('hex');

				const now = new Date();

				await deps.accessTokensRepository.insert({
					id: deps.idService.gen(now.getTime()),
					lastUsedAt: now,
					appId: session.appId,
					userId: me.id,
					token: accessToken,
					hash: hash,
				});
			}

			// Update session
			await deps.authSessionsRepository.update(session.id, {
				userId: me.id,
			});
		})();
		return v.parse(requiredSchema(AuthAcceptContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
