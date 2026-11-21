/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserReactionsContract, chartPerUserReactionsGetContract } from './reactions.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserReactionsProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userReactions']) {
	return createApiProcedure<Actor>()(chartPerUserReactionsContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}
export function createPerUserReactionsGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userReactions']) {
	return createApiProcedure<Actor>()(chartPerUserReactionsGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['userReactions']['getChart']>>) {
	return { local: { count: value.local.count.map(item => item) }, remote: { count: value.remote.count.map(item => item) } };
}
