/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { remainingRetentionDefinition, remainingRetentionInput, remainingRetentionOutput } from '../../contract/remaining-inline-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { RetentionAggregationsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(remainingRetentionDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: contractProjection.response,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingRetentionInput, typeof remainingRetentionOutput> {
	constructor(
		@Inject(DI.retentionAggregationsRepository)
		private retentionAggregationsRepository: RetentionAggregationsRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const records = await this.retentionAggregationsRepository.find({
				order: {
					id: 'DESC',
				},
				take: 30,
			});

			return records.map(record => ({
				createdAt: record.createdAt.toISOString(),
				users: record.usersCount,
				data: record.data,
			}));
		});
	}
}
