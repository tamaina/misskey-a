/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { legacyManagementOnly } from '../../../legacy-management.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';
import { MiUserSecurityKey } from '../../../models/UserSecurityKey.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { assertLegacyMfaManagement, assertMfaFactorRetained } from '../../../mfa-policy.js';
import { withLockedMfaProfile } from '../../../locked-mfa-profile.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import { I2faRemoveKeyContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '141c598d-a825-44c8-9173-cfb9d92be493',
		},
	},
} as const;
export interface I2faRemoveKeyDependencies {
	db: DataSource;
	userSecurityKeysRepository: UserSecurityKeysRepository;
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faRemoveKeyProcedure(deps: I2faRemoveKeyDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faRemoveKeyContract).use(requirePrincipal<MiLocalUser>()).use(legacyManagementOnly()).handler(async ({ input, context }) => {
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

			const passwordMatched = await bcrypt.compare(ps.password, profile.password ?? '');
			if (!passwordMatched) {
				throw apiError(meta.errors.incorrectPassword);
			}

			await withLockedMfaProfile(deps.db, me.id, profile, async (current, manager) => {
				assertLegacyMfaManagement(current);
				const keys = manager.getRepository(MiUserSecurityKey);
				// Only owned credentials can be deleted, and a rejected policy rolls it back.
				await keys.delete({ userId: me.id, id: ps.credentialId });
				const keyCount = await keys.count({ where: { userId: me.id } });
				assertMfaFactorRetained(current, keyCount);
				if (keyCount === 0) {
					await manager.getRepository(MiUserProfile).update({ userId: me.id }, { usePasswordLessLogin: false, passkeyMfaEnabled: false });
				}
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {};
		})();
		return result;
	});
}
