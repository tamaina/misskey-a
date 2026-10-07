/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { emptyObjectI2faRemoveKeyDefinition, emptyObjectI2faRemoveKeyInput, emptyObjectI2faRemoveKeyOutput } from '../../../../contract/empty-object-key-endpoint-definitions.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@/models/_.js';
import { UserEntityService } from '../../../../../users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

const contractProjection = projectEndpointContract(emptyObjectI2faRemoveKeyDefinition);

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '141c598d-a825-44c8-9173-cfb9d92be493',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof emptyObjectI2faRemoveKeyInput, typeof emptyObjectI2faRemoveKeyOutput> {
	constructor(
		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

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

			// Make sure we only delete the user's own creds
			await this.userSecurityKeysRepository.delete({
				userId: me.id,
				id: ps.credentialId,
			});

			// 使われているキーがなくなったらパスワードレスログインをやめる
			const keyCount = await this.userSecurityKeysRepository.count({
				where: {
					userId: me.id,
				},
				select: {
					id: true,
					name: true,
					lastUsed: true,
				},
			});

			if (keyCount === 0) {
				await this.userProfilesRepository.update(me.id, {
					usePasswordLessLogin: false,
				});
			}

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}));

			return {};
		});
	}
}
