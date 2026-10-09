/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as OTPAuth from 'otpauth';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { UserAuthService } from '../../../services/UserAuthService.js';
import * as v from 'valibot';
import { I2faDoneContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export const meta = {
	requireCredential: true,

	secure: true,
} as const;
export interface I2faDoneDependencies {
	userProfilesRepository: UserProfilesRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	userAuthService: Pick<UserAuthService, 'validateOtp'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createI2faDoneProcedure(deps: I2faDoneDependencies) {
	return implement(I2faDoneContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'i/2fa/done', requireCredential: true, secure: true })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const token = ps.token.replace(/\s/g, '');

			const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorTempSecret == null) {
				throw new Error('二段階認証の設定が開始されていません');
			}

			if (!await deps.userAuthService.validateOtp(profile.userId, profile.twoFactorTempSecret, token)) {
				throw new Error('not verified');
			}

			const backupCodes = Array.from({ length: 5 }, () => new OTPAuth.Secret().base32);

			await deps.userProfilesRepository.update(me.id, {
				twoFactorSecret: profile.twoFactorTempSecret,
				twoFactorBackupSecret: backupCodes,
				twoFactorEnabled: true,
			});

			// Publish meUpdated event
			deps.globalEventService.publishMainStream(me.id, 'meUpdated', await deps.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {
				backupCodes: backupCodes,
			};
		})();
		return v.parse(requiredSchema(I2faDoneContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
