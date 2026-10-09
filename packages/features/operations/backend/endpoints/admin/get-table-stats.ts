/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { adminGetTableStatsContract } from './get-table-stats.contract.js';
import type { DataSource } from 'typeorm';
import * as v from 'valibot';
export interface AdminGetTableStatsDependencies {
	db: Pick<DataSource, 'query'>;
}
export function createAdminGetTableStatsProcedure<Actor extends ApiActor>(deps: AdminGetTableStatsDependencies) {
	return implement(adminGetTableStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminGetTableStatsContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'read:admin:table-stats' }))
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const sizes = await deps.db.query<unknown>(`
		SELECT relname AS "table", reltuples as "count", pg_total_relation_size(C.oid) AS "size"
		FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
		WHERE nspname NOT IN ('pg_catalog', 'information_schema')
			AND C.relkind <> 'i'
			AND nspname !~ '^pg_toast';`)
					.then(raw => {
						const recs = v.parse(v.array(v.strictObject({
							table: v.string(),
							count: v.union([v.string(), v.pipe(v.number(), v.finite())]),
							size: v.union([v.string(), v.pipe(v.number(), v.finite())]),
						})), raw);
						return Object.fromEntries(recs.map((rec): [string, { count: number; size: number }] => [rec.table, {
							count: parseInt(String(rec.count), 10), size: parseInt(String(rec.size), 10),
						}]));
					});
				return sizes;
			})();
			return v.parse(adminGetTableStatsContract['~orpc'].outputSchema!, result);
		});
}
