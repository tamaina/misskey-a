/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartFederationContract, chartFederationGetContract } from './federation.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createFederationProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['federation']) {
	return createApiProcedure<Actor>()(chartFederationContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createFederationGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['federation']) {
	return createApiProcedure<Actor>()(chartFederationGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['federation']['getChart']>>) {
	return { deliveredInstances: value.deliveredInstances.map(item => item), inboxInstances: value.inboxInstances.map(item => item), stalled: value.stalled.map(item => item), sub: value.sub.map(item => item), pub: value.pub.map(item => item), pubsub: value.pubsub.map(item => item), subActive: value.subActive.map(item => item), pubActive: value.pubActive.map(item => item) };
}
