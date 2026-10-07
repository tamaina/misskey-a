/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { remainingIRegistryRemoveDefinition, remainingIRegistryRemoveInput, remainingIRegistryRemoveOutput } from '../../../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { RegistryItemsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { RegistryApiService } from '../../../services/RegistryApiService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(remainingIRegistryRemoveDefinition);

export const meta = {
	requireCredential: true,
	kind: 'write:account',

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: '1fac4e8a-a6cd-4e39-a4a5-3a7e11f1b019',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingIRegistryRemoveInput, typeof remainingIRegistryRemoveOutput> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, contractProjection, async (ps, me, accessToken) => {
			await this.registryApiService.remove(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope, ps.key);
		});
	}
}
