/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import * as v from 'valibot';
import { inlineI2faRegisterInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '78d6c839-20c9-4c66-b90a-fc0542168b48',
		},
	},
} as const;

@Injectable()
export class I2faRegisterOperation {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineI2faRegisterInput>, me: MiLocalUser) {
		const token = ps.token;
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

		if (profile.twoFactorEnabled) {
			if (token == null) {
				throw new Error('authentication failed');
			}

			try {
				await this.userAuthService.twoFactorAuthenticate(profile, token);
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

		await this.userProfilesRepository.update(me.id, {
			twoFactorTempSecret: secret.base32,
		});

		// Get the data URL of the authenticator URL
		const totp = new OTPAuth.TOTP({
			secret,
			digits: 6,
			label: me.username,
			issuer: this.config.host,
		});
		const url = totp.toString();
		const qr = await QRCode.toDataURL(url);

		return {
			qr,
			url,
			secret: secret.base32,
			label: me.username,
			issuer: this.config.host,
		};
	}
}
