/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { credentialIssuanceIdentity, type CredentialIssuanceAuthorization } from '../../credential-issuance.js';
import { selectedTokenExpiry } from '../../access-token-expiry.js';
import { MiAccessToken } from '../../models/AccessToken.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { AccessTokensRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';

import { MiauthGenTokenContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['auth'],

} as const;
export interface MiauthGenTokenDependencies {
	local: CredentialIssuanceAuthorization;
	accessTokensRepository: AccessTokensRepository;
	idService: Pick<IdService, 'gen'>;
	notificationService: Pick<NotificationService, 'createNotification'>;
}
export function createMiauthGenTokenProcedure(deps: MiauthGenTokenDependencies) {
	return createApiProcedure<MiLocalUser>()(MiauthGenTokenContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await deps.local.transaction(credentialIssuanceIdentity(context), async ({ manager }) => {
			// Generate access token
			const accessToken = secureRndstr(32);

			const now = new Date();

			// Insert access token doc
			await manager.getRepository(MiAccessToken).insert({
				id: deps.idService.gen(now.getTime()),
				lastUsedAt: now,
				expiresAt: selectedTokenExpiry(ps.expiresAt),
				session: ps.session,
				userId: me.id,
				token: accessToken,
				hash: accessToken,
				name: ps.name,
				description: ps.description,
				iconUrl: ps.iconUrl,
				permission: ps.permission,
			});


			return {
				token: accessToken,
			};
		});
		void deps.notificationService.createNotification(me.id, 'createToken', {});
		return result;
	});
}
