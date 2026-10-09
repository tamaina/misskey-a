/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { WebAuthnService } from '../../../services/WebAuthnService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import type * as v from 'valibot';
import type { I2faRegisterKeyContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		userNotFound: {
			message: 'User not found.',
			code: 'USER_NOT_FOUND',
			id: '652f899f-66d4-490e-993e-6606c8ec04c3',
		},

		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '38769596-efe2-4faf-9bec-abbb3f2cd9ba',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: 'bf32b864-449b-47b8-974e-f9a5468546f1',
		},
	},
} as const;

@Injectable()
export class I2faRegisterKeyOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private webAuthnService: WebAuthnService,
		private userAuthService: UserAuthService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof I2faRegisterKeyContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const token = ps.token;
		const profile = await this.userProfilesRepository.findOne({
			where: {
				userId: me.id,
			},
			relations: { user: true },
		});

		if (profile == null) {
			throw apiError(meta.errors.userNotFound);
		}

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

		if (!profile.twoFactorEnabled) {
			throw apiError(meta.errors.twoFactorNotEnabled);
		}

		return await this.webAuthnService.initiateRegistration(
			me.id,
			profile.user?.username ?? me.id,
			profile.user?.name ?? undefined,
		);
	}
}
