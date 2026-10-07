/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { constantIClaimAchievementDefinition, constantIClaimAchievementInput, constantIClaimAchievementOutput } from '../../../contract/source-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { AchievementService } from '../../services/AchievementService.js';

const contractProjection = projectEndpointContract(constantIClaimAchievementDefinition);

export const meta = {
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:account',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof constantIClaimAchievementInput, typeof constantIClaimAchievementOutput> {
	constructor(
		private achievementService: AchievementService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.achievementService.create(me.id, ps.name);
		});
	}
}
