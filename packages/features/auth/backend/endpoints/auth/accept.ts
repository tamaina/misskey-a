/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { credentialIssuanceIdentity, type CredentialIssuanceAuthorization } from '../../credential-issuance.js';
import { selectedTokenExpiry, accessTokenExpired } from '../../access-token-expiry.js';
import { MiAccessToken } from '../../models/AccessToken.js';
import { MiAuthSession } from '../../models/AuthSession.js';
import { MiApp } from '../../models/App.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import * as crypto from 'node:crypto';
import type { AuthSessionsRepository, AppsRepository, AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { AuthAcceptContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['auth'],

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '9c72d8de-391a-43c1-9d06-08d29efde8df',
		},
	},
} as const;
export interface AuthAcceptDependencies {
	local: CredentialIssuanceAuthorization;
	appsRepository: AppsRepository;
	authSessionsRepository: AuthSessionsRepository;
	accessTokensRepository: AccessTokensRepository;
	idService: Pick<IdService, 'gen'>;
}
export function createAuthAcceptProcedure(deps: AuthAcceptDependencies) {
	return createApiProcedure<MiLocalUser>()(AuthAcceptContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await deps.local.transaction(credentialIssuanceIdentity(context), async ({ manager }) => {
			// Fetch token
			const session = await manager.getRepository(MiAuthSession).findOne({ where: { token: ps.token }, lock: { mode: 'pessimistic_write' } });

			if (session == null || (session.userId !== null && session.userId !== me.id)) {
				throw apiError(meta.errors.noSuchSession);
			}

			const accessToken = secureRndstr(32);

			// Fetch exist access token
			const existing = await manager.getRepository(MiAccessToken).findOne({
				where: {
					appId: session.appId,
					userId: me.id,
				},
			});

			if (existing && !accessTokenExpired(existing) && ps.expiresAt !== undefined && (existing.expiresAt?.getTime() ?? null) !== (selectedTokenExpiry(ps.expiresAt)?.getTime() ?? null)) throw apiError({ code: 'INVALID_PARAM', status: 400, message: 'Revoke the existing app token before selecting a different expiry.', id: '4cccbf4a-1d28-4c63-8107-6bdef529c70f' });
			if (!existing || accessTokenExpired(existing)) {
				if (existing) await manager.getRepository(MiAccessToken).delete({ id: existing.id, userId: me.id });
				const app = await manager.getRepository(MiApp).findOneByOrFail({ id: session.appId });

				// Generate Hash
				const sha256 = crypto.createHash('sha256');
				sha256.update(accessToken + app.secret);
				const hash = sha256.digest('hex');

				const now = new Date();

				await manager.getRepository(MiAccessToken).insert({
					id: deps.idService.gen(now.getTime()),
					lastUsedAt: now,
					expiresAt: selectedTokenExpiry(ps.expiresAt),
					appId: session.appId,
					userId: me.id,
					token: accessToken,
					hash: hash,
				});
			}

			// Update session
			await manager.getRepository(MiAuthSession).update(session.id, {
				userId: me.id,
			});
		});
		return result;
	});
}
