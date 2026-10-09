/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { chartInstanceContract, chartInstanceGetContract } from './instance.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.dependencies.js';
export function createInstanceProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['instance']) {
	return implement(chartInstanceContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartInstanceContract['~orpc'].meta.requestName }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.host));
}
export function createInstanceGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['instance']) {
	return implement(chartInstanceGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartInstanceContract['~orpc'].meta.requestName }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.host));
}
