/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { remainingIRegistryKeysWithTypeDefinition, remainingIRegistryKeysWithTypeInput, remainingIRegistryKeysWithTypeOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { RegistryApiService } from '../../../services/RegistryApiService.js';

const contractProjection = projectEndpointContract(remainingIRegistryKeysWithTypeDefinition);

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistryKeysWithTypeInput, typeof remainingIRegistryKeysWithTypeOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			const items = await this.registryApiService.getAllItemsOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);

			const res = {} as Record<string, string>;

			for (const item of items) {
				const type = typeof item.value;
				res[item.key] =
					item.value === null ? 'null' :
					Array.isArray(item.value) ? 'array' :
					type === 'number' ? 'number' :
					type === 'string' ? 'string' :
					type === 'boolean' ? 'boolean' :
					type === 'object' ? 'object' :
					null as never;
			}

			return res;
		});
	}
}
