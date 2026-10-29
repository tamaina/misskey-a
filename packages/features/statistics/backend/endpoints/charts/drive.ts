/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartDriveContract, chartDriveGetContract } from './drive.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createDriveProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['drive']) {
	return createApiProcedure<Actor>()(chartDriveContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createDriveGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['drive']) {
	return createApiProcedure<Actor>()(chartDriveGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['drive']['getChart']>>) {
	return { local: { incCount: value.local.incCount.map(item => item), incSize: value.local.incSize.map(item => item), decCount: value.local.decCount.map(item => item), decSize: value.local.decSize.map(item => item) }, remote: { incCount: value.remote.incCount.map(item => item), incSize: value.remote.incSize.map(item => item), decCount: value.remote.decCount.map(item => item), decSize: value.remote.decSize.map(item => item) } };
}
