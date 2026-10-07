/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAdminAccountsFindByEmailDefinition, packedAdminAccountsFindByEmailInput, packedAdminAccountsFindByEmailOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../../../serializers/UserEntityService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAdminAccountsFindByEmailDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:account',

	errors: {
		userNotFound: {
			message: 'No such user who has the email address.',
			code: 'USER_NOT_FOUND',
			id: 'cb865949-8af5-4062-a88c-ef55e8786d1d',
		},
	},
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAccountsFindByEmailInput, typeof packedAdminAccountsFindByEmailOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOne({
				where: { email: ps.email },
				relations: { user: true },
			});

			if (profile == null) {
				throw new ApiError(meta.errors.userNotFound);
			}

			const res = await this.userEntityService.pack(profile.user!, null, {
				schema: 'UserDetailedNotMe',
			});

			return res;
		});
	}
}
