/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { WebAuthnService } from '../../../services/WebAuthnService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import type * as v from 'valibot';
import type { I2faKeyDoneContract } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '0d7ec6d2-e652-443e-a7bf-9ee9a0cd77b0',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: '798d6847-b1ed-4f9c-b1f9-163c42655995',
		},
	},
} as const;

@Injectable()
export class I2faKeyDoneOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private webAuthnService: WebAuthnService,
		private userAuthService: UserAuthService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof I2faKeyDoneContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
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

		if (!profile.twoFactorEnabled) {
			throw apiError(meta.errors.twoFactorNotEnabled);
		}

		const keyInfo = await this.webAuthnService.verifyRegistration(me.id, ps.credential);
		const keyId = keyInfo.credentialID;

		await this.userSecurityKeysRepository.insert({
			id: keyId,
			userId: me.id,
			name: ps.name,
			publicKey: Buffer.from(keyInfo.credentialPublicKey).toString('base64url'),
			counter: keyInfo.counter,
			credentialDeviceType: keyInfo.credentialDeviceType,
			credentialBackedUp: keyInfo.credentialBackedUp,
			transports: keyInfo.transports,
		});

		// Publish meUpdated event
		this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
			includeSecrets: true,
		}));

		return {
			id: keyId,
			name: ps.name,
		};
	}
}
