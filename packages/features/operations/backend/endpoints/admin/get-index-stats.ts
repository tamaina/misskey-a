/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAdminGetIndexStatsDefinition, inlineAdminGetIndexStatsInput, inlineAdminGetIndexStatsOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineAdminGetIndexStatsDefinition);

export const meta = {
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:index-stats',

	tags: ['admin'],
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminGetIndexStatsInput, typeof inlineAdminGetIndexStatsOutput> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {
		super(meta, contractProjection, async () => {
			const stats = await this.db.query('SELECT * FROM pg_indexes;').then(recs => {
				const res = [] as { tablename: string; indexname: string; }[];
				for (const rec of recs) {
					res.push(rec);
				}
				return res;
			});

			return stats;
		});
	}
}
