/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminFederationRefreshRemoteInstanceMetadataDefinition, voidAdminFederationRefreshRemoteInstanceMetadataInput, voidAdminFederationRefreshRemoteInstanceMetadataOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { InstancesRepository } from '@/models/_.js';
import { FetchInstanceMetadataService } from '../../../services/FetchInstanceMetadataService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidAdminFederationRefreshRemoteInstanceMetadataDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:federation',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminFederationRefreshRemoteInstanceMetadataInput, typeof voidAdminFederationRefreshRemoteInstanceMetadataOutput> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const instance = await this.instancesRepository.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			if (instance == null) {
				throw new Error('instance not found');
			}

			this.fetchInstanceMetadataService.fetchInstanceMetadata(instance, true);
		});
	}
}
