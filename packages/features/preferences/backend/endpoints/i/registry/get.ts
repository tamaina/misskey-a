/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { remainingIRegistryGetDefinition, remainingIRegistryGetInput, remainingIRegistryGetOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { RegistryApiService } from '../../../services/RegistryApiService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(remainingIRegistryGetDefinition);

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a',
		},
	},

	res: contractProjection.response
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistryGetInput, typeof remainingIRegistryGetOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			const item = await this.registryApiService.getItem(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope, ps.key);

			if (item == null) {
				throw new ApiError(meta.errors.noSuchKey);
			}

			return item.value;
		});
	}
}
