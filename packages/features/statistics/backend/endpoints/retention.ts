/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import { retentionContract, retentionGetContract } from './retention.contract.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../operations.js';

export function createRetentionProcedure<Actor extends ApiActor>() {
	return implement(retentionContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'retention' }))
		.handler(({ input, context }) => context.operations.statistics.retention(input, context.principal));
}

export function createRetentionGetProcedure<Actor extends ApiActor>() {
	return implement(retentionGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'retention' }))
		.handler(({ input, context }) => context.operations.statistics.retention(input, context.principal));
}
