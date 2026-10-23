/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartUsersContract, chartUsersGetContract } from './users.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createUsersProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['users']) {
	return createApiProcedure<Actor>()(chartUsersContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createUsersGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['users']) {
	return createApiProcedure<Actor>()(chartUsersGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['users']['getChart']>>) {
	return { local: { total: value.local.total.map(item => item), inc: value.local.inc.map(item => item), dec: value.local.dec.map(item => item) }, remote: { total: value.remote.total.map(item => item), inc: value.remote.inc.map(item => item), dec: value.remote.dec.map(item => item) } };
}
