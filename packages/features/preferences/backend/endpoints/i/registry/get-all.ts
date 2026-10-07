/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { remainingIRegistryGetAllDefinition, remainingIRegistryGetAllInput, remainingIRegistryGetAllOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { RegistryApiService } from '../../../services/RegistryApiService.js';

const contractProjection = projectEndpointContract(remainingIRegistryGetAllDefinition);

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistryGetAllInput, typeof remainingIRegistryGetAllOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			const items = await this.registryApiService.getAllItemsOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);

			const res = {} as Record<string, any>;

			for (const item of items) {
				res[item.key] = item.value;
			}

			return res;
		});
	}
}
