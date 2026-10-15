/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserAuthService } from '../../services/UserAuthService.js';
import { regenerateToken } from '../../token-regeneration.js';
import type { TokenRegenerationDependencies } from '../../token-regeneration.js';
import { assertLegacyMfaManagement } from '../../mfa-policy.js';

import { IRegenerateTokenContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface IRegenerateTokenDependencies extends TokenRegenerationDependencies {
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
}
export function createIRegenerateTokenProcedure(deps: IRegenerateTokenDependencies) {
	return createApiProcedure<MiLocalUser>()(IRegenerateTokenContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const freshUser = await deps.usersRepository.findOneByOrFail({ id: me.id });
			if (!freshUser.token) throw new Error('authentication failed');
			const oldToken = freshUser.token;
			if (!context.browserSession && context.credential !== oldToken) throw new Error('authentication failed');

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });
			assertLegacyMfaManagement(profile);
			const expected = { ...profile };

			if (profile.twoFactorEnabled) {
				if (ps.token == null) {
					throw new Error('authentication failed');
				}

				try {
					await deps.userAuthService.twoFactorAuthenticate(profile, ps.token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			await regenerateToken(deps, me.id, { kind: 'legacy', nativeToken: oldToken, profile: expected, session: context.browserSession });
		})();
		return result;
	});
}
