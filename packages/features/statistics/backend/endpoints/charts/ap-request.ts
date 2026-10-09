/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';
import { chartApRequestContract, chartApRequestGetContract } from './ap-request.contract.js';

export function createApRequestProcedure<Actor extends ApiActor>() {
	return implement(chartApRequestContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/ap-request' }))
		.handler(({ input, context }) => context.operations.statistics.apRequest(input, context.principal));
}

export function createApRequestGetProcedure<Actor extends ApiActor>() {
	return implement(chartApRequestGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/ap-request' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.apRequest(input, context.principal));
}
