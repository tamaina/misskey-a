/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { referenceUsersAchievementsDefinition, referenceUsersAchievementsInput, referenceUsersAchievementsOutput } from '../../../contract/reference-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(referenceUsersAchievementsDefinition);

export const meta = {
	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof referenceUsersAchievementsInput, typeof referenceUsersAchievementsOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

			return profile.achievements;
		});
	}
}
