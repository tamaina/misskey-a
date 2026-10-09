/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserPvContract, chartPerUserPvGetContract } from './pv.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserPvProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userPv']) {
	return createApiProcedure<Actor>()(chartPerUserPvContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}
export function createPerUserPvGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userPv']) {
	return createApiProcedure<Actor>()(chartPerUserPvGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['userPv']['getChart']>>) {
	return { upv: { user: value.upv.user.map(item => item), visitor: value.upv.visitor.map(item => item) }, pv: { user: value.pv.user.map(item => item), visitor: value.pv.visitor.map(item => item) } };
}
