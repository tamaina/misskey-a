/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAdminGetTableStatsDefinition, inlineAdminGetTableStatsInput, inlineAdminGetTableStatsOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineAdminGetTableStatsDefinition);

export const meta = {
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:table-stats',

	tags: ['admin'],

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminGetTableStatsInput, typeof inlineAdminGetTableStatsOutput> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {
		super(meta, contractProjection, async () => {
			const sizes = await this.db.query(`
			SELECT relname AS "table", reltuples as "count", pg_total_relation_size(C.oid) AS "size"
			FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
			WHERE nspname NOT IN ('pg_catalog', 'information_schema')
				AND C.relkind <> 'i'
				AND nspname !~ '^pg_toast';`)
				.then(recs => {
					const res = {} as Record<string, { count: number; size: number; }>;
					for (const rec of recs) {
						res[rec.table] = {
							count: parseInt(rec.count, 10),
							size: parseInt(rec.size, 10),
						};
					}
					return res;
				});

			return sizes;
		});
	}
}
