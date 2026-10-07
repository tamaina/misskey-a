/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineAdminGetUserIpsDefinition, inlineAdminGetUserIpsInput, inlineAdminGetUserIpsOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserIpsRepository } from '@/models/_.js';

import { DI } from '@/di-symbols.js';
import { IdService } from '../../../../runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(inlineAdminGetUserIpsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:user-ips',
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminGetUserIpsInput, typeof inlineAdminGetUserIpsOutput> {
	constructor(
		@Inject(DI.userIpsRepository)
		private userIpsRepository: UserIpsRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const ips = await this.userIpsRepository.find({
				where: { userId: ps.userId },
				order: { id: 'DESC' },
				take: 30,
			});

			return ips.map(x => ({
				ip: x.ip,
				createdAt: x.createdAt.toISOString(),
			}));
		});
	}
}
