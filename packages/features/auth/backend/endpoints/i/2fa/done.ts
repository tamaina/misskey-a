/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineI2faDoneDefinition, inlineI2faDoneInput, inlineI2faDoneOutput } from '../../../../contract/endpoint-definitions.js';
import * as OTPAuth from 'otpauth';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { UserAuthService } from "../../../services/UserAuthService.js";

const contractProjection = projectEndpointContract(inlineI2faDoneDefinition);

export const meta = {
	requireCredential: true,

	secure: true,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineI2faDoneInput, typeof inlineI2faDoneOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private userAuthService: UserAuthService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const token = ps.token.replace(/\s/g, '');

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorTempSecret == null) {
				throw new Error('二段階認証の設定が開始されていません');
			}

			if (!await this.userAuthService.validateOtp(profile.userId, profile.twoFactorTempSecret, token)) {
				throw new Error('not verified');
			}

			const backupCodes = Array.from({ length: 5 }, () => new OTPAuth.Secret().base32);

			await this.userProfilesRepository.update(me.id, {
				twoFactorSecret: profile.twoFactorTempSecret,
				twoFactorBackupSecret: backupCodes,
				twoFactorEnabled: true,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
				includeSecrets: true,
			}));

			return {
				backupCodes: backupCodes,
			};
		});
	}
}
