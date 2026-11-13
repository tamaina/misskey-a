/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedRecord } from '@features/users/backend/json-value.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { retentionContract, retentionGetContract } from './retention.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../api.implementation.js';
export function createRetentionProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readRetention'>) {
	return createApiProcedure<Actor>()(retentionContract)
		.handler(async () => {
			const records = await deps.readRetention({ order: { id: 'DESC' }, take: 30 });
			return records.map(record => ({ createdAt: record.createdAt.toISOString(), users: record.usersCount, data: toPackedRecord(record.data) }));
		});
}
export function createRetentionGetProcedure<Actor extends ApiActor>(deps: Pick<StatisticsDependencies, 'readRetention'>) {
	return createApiProcedure<Actor>()(retentionGetContract)
		.handler(async () => {
			const records = await deps.readRetention({ order: { id: 'DESC' }, take: 30 });
			return records.map(record => ({ createdAt: record.createdAt.toISOString(), users: record.usersCount, data: toPackedRecord(record.data) }));
		});
}
