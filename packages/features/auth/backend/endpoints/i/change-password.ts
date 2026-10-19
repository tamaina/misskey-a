/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { assertLegacyMfaManagement } from '../../mfa-policy.js';
import { withLockedMfaProfile } from '../../locked-mfa-profile.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { UserAuthService } from '../../services/UserAuthService.js';

import { IChangePasswordContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface IChangePasswordDependencies {
	db: DataSource;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
}
export function createIChangePasswordProcedure(deps: IChangePasswordDependencies) {
	return createApiProcedure<MiLocalUser>()(IChangePasswordContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token;
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });
			assertLegacyMfaManagement(profile);

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await deps.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await bcrypt.compare(ps.currentPassword, profile.password!);

			if (!passwordMatched) {
				throw new Error('incorrect password');
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(ps.newPassword, salt);

			await withLockedMfaProfile(deps.db, me.id, profile, async (locked, manager) => {
				assertLegacyMfaManagement(locked);
				await manager.getRepository(MiUserProfile).update({ userId: me.id }, { password: hash });
			});
		})();
		return result;
	});
}
