/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import { chartFederationContract, chartFederationGetContract } from './federation.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.dependencies.js';
export function createFederationProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['federation']) {
	return implement(chartFederationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartFederationContract['~orpc'].meta.requestName }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
export function createFederationGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['federation']) {
	return implement(chartFederationGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartFederationContract['~orpc'].meta.requestName }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
