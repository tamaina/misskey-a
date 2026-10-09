/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import { retentionContract, retentionGetContract } from './retention.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../api.implementation.js';
export function createRetentionProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readRetention'>) {
	return implement(retentionContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: retentionContract['~orpc'].meta.requestName }))
		.handler(async () => {
			const records = await deps.readRetention({ order: { id: 'DESC' }, take: 30 });
			return records.map(record => ({ createdAt: record.createdAt.toISOString(), users: record.usersCount, data: record.data }));
		});
}
export function createRetentionGetProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readRetention'>) {
	return implement(retentionGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: retentionContract['~orpc'].meta.requestName }))
		.handler(async () => {
			const records = await deps.readRetention({ order: { id: 'DESC' }, take: 30 });
			return records.map(record => ({ createdAt: record.createdAt.toISOString(), users: record.usersCount, data: record.data }));
		});
}
