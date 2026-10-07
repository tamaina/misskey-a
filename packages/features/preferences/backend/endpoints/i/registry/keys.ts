/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { remainingIRegistryKeysDefinition, remainingIRegistryKeysInput, remainingIRegistryKeysOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { RegistryApiService } from '../../../services/RegistryApiService.js';

const contractProjection = projectEndpointContract(remainingIRegistryKeysDefinition);

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistryKeysInput, typeof remainingIRegistryKeysOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			return await this.registryApiService.getAllKeysOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);
		});
	}
}
