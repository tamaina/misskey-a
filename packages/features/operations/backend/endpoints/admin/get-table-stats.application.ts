/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminGetTableStatsInput, AdminGetTableStatsOutput } from './get-table-stats.contract.js';
import { adminGetTableStatsContract } from './get-table-stats.contract.js';

@Injectable()
export class AdminGetTableStatsApplicationService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {}

	public async execute(_ps: AdminGetTableStatsInput, _me: MiUser): Promise<AdminGetTableStatsOutput> {
		const result = await (async () => {
			const sizes = await this.db.query<unknown>(`
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
	}
}
