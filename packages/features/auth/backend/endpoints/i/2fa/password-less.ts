/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidI2faPasswordLessDefinition, voidI2faPasswordLessInput, voidI2faPasswordLessOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@/models/_.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidI2faPasswordLessDefinition);

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noKey: {
			message: 'No security key.',
			code: 'NO_SECURITY_KEY',
			id: 'f9c54d7f-d4c2-4d3c-9a8g-a70daac86512',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidI2faPasswordLessInput, typeof voidI2faPasswordLessOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.value === true) {
				// セキュリティキーがなければパスワードレスを有効にはできない
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

					throw new ApiError(meta.errors.noKey);
				}
			}

			await this.userProfilesRepository.update(me.id, {
				usePasswordLessLogin: ps.value,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}));
		});
	}
}
