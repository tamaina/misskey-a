/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidI2faUnregisterDefinition, voidI2faUnregisterInput, voidI2faUnregisterOutput } from '../../../../contract/void-endpoint-definitions.js';
import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '../../../../../users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

const contractProjection = projectEndpointContract(voidI2faUnregisterDefinition);

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '7add0395-9901-4098-82f9-4f67af65f775',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidI2faUnregisterInput, typeof voidI2faUnregisterOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private userAuthService: UserAuthService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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
				throw new ApiError(meta.errors.incorrectPassword);
			}

			await this.userProfilesRepository.update(me.id, {
				twoFactorSecret: null,
				twoFactorBackupSecret: null,
				twoFactorEnabled: false,
				usePasswordLessLogin: false,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}));
		});
	}
}
