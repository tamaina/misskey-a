/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartActiveUsersContract, chartActiveUsersGetContract } from './active-users.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createActiveUsersProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['activeUsers']) {
	return implement(chartActiveUsersContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartActiveUsersContract['~orpc'].meta.requestName }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
export function createActiveUsersGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['activeUsers']) {
	return implement(chartActiveUsersGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: chartActiveUsersContract['~orpc'].meta.requestName }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input }) => deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null));
}
