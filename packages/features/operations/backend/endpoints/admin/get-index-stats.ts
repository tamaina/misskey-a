/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import { adminGetIndexStatsContract } from './get-index-stats.contract.js';
import type { DataSource } from 'typeorm';
import * as v from 'valibot';
export interface AdminGetIndexStatsDependencies {
	db: Pick<DataSource, 'query'>;
}
export function createAdminGetIndexStatsProcedure<Actor extends ApiActor>(deps: AdminGetIndexStatsDependencies) {
	return implement(adminGetIndexStatsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminGetIndexStatsContract['~orpc'].meta.requestName, requireCredential: true, requireAdmin: true, kind: 'read:admin:index-stats' }))
		.use(requirePrincipal<Actor>())
		.handler(async () => {
			const result = await (async () => {
				const stats = await deps.db.query<unknown>('SELECT * FROM pg_indexes;');
				return stats;
			})();
			return v.parse(adminGetIndexStatsContract['~orpc'].outputSchema!, result);
		});
}
