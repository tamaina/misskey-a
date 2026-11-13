/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { MiBrowserSession, MiUser } from '@features/persistence/backend/repositories/models.js';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserAuthService } from '../../services/UserAuthService.js';
import { generateNativeUserToken } from '../../utility/token.js';
import type { BrowserSessionService } from '../../services/BrowserSessionService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';

import { IRegenerateTokenContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface IRegenerateTokenDependencies {
	db: Pick<DataSource, 'transaction'>;
	browserSessionService: Pick<BrowserSessionService, 'revokeAllOwned'>;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent' | 'publishMainStream'>;
}
export function createIRegenerateTokenProcedure(deps: IRegenerateTokenDependencies) {
	return createApiProcedure<MiLocalUser>()(IRegenerateTokenContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const freshUser = await deps.usersRepository.findOneByOrFail({ id: me.id });
			const oldToken = freshUser.token!;

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

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

			const newToken = generateNativeUserToken();

			await deps.db.transaction(async manager => {
				await manager.getRepository(MiUser).update(me.id, { token: newToken });
				await deps.browserSessionService.revokeAllOwned(me.id, manager.getRepository(MiBrowserSession));
			});
			deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: null, userId: me.id });

			// Publish event
			deps.globalEventService.publishInternalEvent('userTokenRegenerated', { id: me.id, oldToken, newToken });
			deps.globalEventService.publishMainStream(me.id, 'myTokenRegenerated');
		})();
		return result;
	});
}
