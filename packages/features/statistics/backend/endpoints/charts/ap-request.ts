/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartApRequestContract, chartApRequestGetContract } from './ap-request.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createApRequestProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['apRequest']) {
	return createApiProcedure<Actor>()(chartApRequestContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createApRequestGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['apRequest']) {
	return createApiProcedure<Actor>()(chartApRequestGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['apRequest']['getChart']>>) {
	return { deliverFailed: value.deliverFailed.map(item => item), deliverSucceeded: value.deliverSucceeded.map(item => item), inboxReceived: value.inboxReceived.map(item => item) };
}
