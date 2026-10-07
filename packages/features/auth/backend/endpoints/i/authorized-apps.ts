/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineIAuthorizedAppsDefinition, inlineIAuthorizedAppsInput, inlineIAuthorizedAppsOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';

import type { AccessTokensRepository } from '@/models/_.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineIAuthorizedAppsDefinition);

export const meta = {
	requireCredential: true,

	secure: true,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineIAuthorizedAppsInput, typeof inlineIAuthorizedAppsOutput> {
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private appEntityService: AppEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Get tokens
			const tokens = await this.accessTokensRepository.find({
				where: {
					userId: me.id,
					appId: Not(IsNull()),
				},
				take: ps.limit,
				skip: ps.offset,
				order: {
					id: ps.sort === 'asc' ? 1 : -1,
				},
			});

			return await Promise.all(tokens.map(token => this.appEntityService.pack(token.appId!, me, {
				detail: true,
			})));
		});
	}
}
