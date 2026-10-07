/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedIDefinition, packedIInput, packedIOutput } from '../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

import { UserEntityService } from '../serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedIDefinition);

export const meta = {
	tags: ['account'],

	requireCredential: true,
	kind: "read:account",

	res: contractProjection.response,

	errors: {
		userIsDeleted: {
			message: 'User is deleted.',
			code: 'USER_IS_DELETED',
			id: 'e5b3b9f0-2b8f-4b9f-9c1f-8c5c1b2e1b1a',
			kind: 'permission',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedIInput, typeof packedIOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, async (ps, user, token) => {
			const isSecure = token == null;

			const now = new Date();
			const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

			// 渡ってきている user はキャッシュされていて古い可能性があるので改めて取得
			const userProfile = await this.userProfilesRepository.findOne({
				where: {
					userId: user.id,
				},
				relations: { user: true },
			});

			if (userProfile == null) {
				throw new ApiError(meta.errors.userIsDeleted);
			}

			if (!userProfile.loggedInDates.includes(today)) {
				this.userProfilesRepository.update({ userId: user.id }, {
					loggedInDates: [...userProfile.loggedInDates, today],
				});
				userProfile.loggedInDates = [...userProfile.loggedInDates, today];
			}

			return await this.userEntityService.pack(userProfile.user!, userProfile.user!, {
				schema: 'MeDetailed',
				includeSecrets: isSecure,
				userProfile,
			});
		});
	}
}
