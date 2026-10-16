/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import * as OTPAuth from 'otpauth';
import type { DataSource } from 'typeorm';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { assertLegacyMfaManagement } from '../../../mfa-policy.js';
import { withLockedMfaProfile } from '../../../locked-mfa-profile.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import { I2faDoneContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

} as const;
export interface I2faDoneDependencies {
	db: DataSource;
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	userAuthService: Pick<UserAuthService, 'validateOtp'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faDoneProcedure(deps: I2faDoneDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faDoneContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token.replace(/\s/g, '');

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });
			assertLegacyMfaManagement(profile);

			if (profile.twoFactorTempSecret == null) {
				throw new Error('二段階認証の設定が開始されていません');
			}

			if (!await deps.userAuthService.validateOtp(profile.userId, profile.twoFactorTempSecret, token)) {
				throw new Error('not verified');
			}

			const backupCodes = Array.from({ length: 5 }, () => new OTPAuth.Secret().base32);

			const pendingSecret = profile.twoFactorTempSecret;
			await withLockedMfaProfile(deps.db, me.id, profile, async (locked, manager) => {
				assertLegacyMfaManagement(locked);
				if (locked.twoFactorTempSecret !== pendingSecret) throw new Error('authentication failed');
				await manager.getRepository(MiUserProfile).update({ userId: me.id }, {
					twoFactorSecret: pendingSecret,
					twoFactorTempSecret: null,
					twoFactorBackupSecret: backupCodes,
					twoFactorEnabled: true,
				});
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {
				backupCodes: backupCodes,
			};
		})();
		return result;
	});
}
