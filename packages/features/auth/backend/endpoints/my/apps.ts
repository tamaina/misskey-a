/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedMyAppsDefinition, packedMyAppsInput, packedMyAppsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AppsRepository } from '@/models/_.js';
import { AppEntityService } from '../../serializers/AppEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedMyAppsDefinition);

export const meta = {
	tags: ['account', 'app'],

	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedMyAppsInput, typeof packedMyAppsOutput> {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = {
				userId: me.id,
			};

			const apps = await this.appsRepository.find({
				where: query,
				take: ps.limit,
				skip: ps.offset,
			});

			return await Promise.all(apps.map(app => this.appEntityService.pack(app, me, {
				detail: true,
			})));
		});
	}
}
