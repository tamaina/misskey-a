/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineIRegistryScopesWithDomainDefinition, inlineIRegistryScopesWithDomainInput, inlineIRegistryScopesWithDomainOutput } from '../../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { RegistryApiService } from '../../../services/RegistryApiService.js';

const contractProjection = projectEndpointContract(inlineIRegistryScopesWithDomainDefinition);

export const meta = {
	requireCredential: true,
	secure: true,

	res: contractProjection.response
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineIRegistryScopesWithDomainInput, typeof inlineIRegistryScopesWithDomainOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.registryApiService.getAllScopeAndDomains(me.id);
		});
	}
}
