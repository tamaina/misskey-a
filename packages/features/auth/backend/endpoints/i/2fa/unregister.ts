/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import { I2faUnregisterContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '7add0395-9901-4098-82f9-4f67af65f775',
		},
	},
} as const;
export interface I2faUnregisterDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faUnregisterProcedure(deps: I2faUnregisterDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faUnregisterContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token;
			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

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

			await deps.userProfilesRepository.update(me.id, {
				twoFactorSecret: null,
				twoFactorBackupSecret: null,
				twoFactorEnabled: false,
				usePasswordLessLogin: false,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));
		})();
		return result;
	});
}
