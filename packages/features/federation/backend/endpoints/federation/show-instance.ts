/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFederationShowInstanceDefinition, packedFederationShowInstanceInput, packedFederationShowInstanceOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { InstancesRepository } from '@/models/_.js';
import { InstanceEntityService } from '@features/instance/backend/serializers/InstanceEntityService.js';
import { UtilityService } from '../../services/UtilityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFederationShowInstanceDefinition);

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFederationShowInstanceInput, typeof packedFederationShowInstanceOutput> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private instanceEntityService: InstanceEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const instance = await this.instancesRepository
				.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			return instance ? await this.instanceEntityService.pack(instance, me) : null;
		});
	}
}
