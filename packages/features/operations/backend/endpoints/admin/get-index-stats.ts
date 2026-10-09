/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { adminGetIndexStatsContract } from './get-index-stats.contract.js';
import type { DataSource } from 'typeorm';
import * as v from 'valibot';
export interface AdminGetIndexStatsDependencies {
	db: Pick<DataSource, 'query'>;
}
export function createAdminGetIndexStatsProcedure<Actor extends ApiActor>(deps: AdminGetIndexStatsDependencies) {
	return createApiProcedure<Actor>()(adminGetIndexStatsContract)
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const stats = await deps.db.query<unknown>('SELECT * FROM pg_indexes;');
				return stats;
			})();
			return v.parse(v.array(v.object({ schemaname: v.nullable(v.string()), tablename: v.string(), indexname: v.string(), tablespace: v.nullable(v.string()), indexdef: v.nullable(v.string()) })), result).map(row => ({ schemaname: row.schemaname, tablename: row.tablename, indexname: row.indexname, tablespace: row.tablespace, indexdef: row.indexdef }));
		});
}
