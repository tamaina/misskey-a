/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { Config } from '@/config.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import { I2faRegisterContract } from '../../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '78d6c839-20c9-4c66-b90a-fc0542168b48',
		},
	},
} as const;
export interface I2faRegisterDependencies {
	config: Config;
	userProfilesRepository: UserProfilesRepository;
	userAuthService: Pick<UserAuthService, 'twoFactorAuthenticate'>;
}
export function createI2faRegisterProcedure(deps: I2faRegisterDependencies) {
	return createApiProcedure<MiLocalUser>()(I2faRegisterContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
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

			// Generate user's secret key
			const secret = new OTPAuth.Secret();

			await deps.userProfilesRepository.update(me.id, {
				twoFactorTempSecret: secret.base32,
			});

			// Get the data URL of the authenticator URL
			const totp = new OTPAuth.TOTP({
				secret,
				digits: 6,
				label: me.username,
				issuer: deps.config.host,
			});
			const url = totp.toString();
			const qr = await QRCode.toDataURL(url);

			return {
				qr,
				url,
				secret: secret.base32,
				label: me.username,
				issuer: deps.config.host,
			};
		})();
		return result;
	});
}
