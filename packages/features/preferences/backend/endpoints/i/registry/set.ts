/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { remainingIRegistrySetDefinition, remainingIRegistrySetInput, remainingIRegistrySetOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { RegistryApiService } from '../../../services/RegistryApiService.js';

const contractProjection = projectEndpointContract(remainingIRegistrySetDefinition);

export const meta = {
	requireCredential: true,
	kind: 'write:account',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistrySetInput, typeof remainingIRegistrySetOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			await this.registryApiService.set(me.id, accessToken ? accessToken.id : (ps.domain ?? null), ps.scope, ps.key, ps.value);
		});
	}
}
