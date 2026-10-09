/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { chartApRequestContract, chartApRequestGetContract } from './ap-request.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.dependencies.js';
export function createApRequestProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['apRequest']) {
	return implement(chartApRequestContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartApRequestContract['~orpc'].meta.requestName }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
export function createApRequestGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['apRequest']) {
	return implement(chartApRequestGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartApRequestContract['~orpc'].meta.requestName }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
