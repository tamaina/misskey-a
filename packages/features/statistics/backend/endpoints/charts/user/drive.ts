/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserDriveContract, chartPerUserDriveGetContract } from './drive.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserDriveProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userDrive']) {
	return createApiProcedure<Actor>()(chartPerUserDriveContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}
export function createPerUserDriveGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userDrive']) {
	return createApiProcedure<Actor>()(chartPerUserDriveGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['userDrive']['getChart']>>) {
	return { totalCount: value.totalCount.map(item => item), totalSize: value.totalSize.map(item => item), incCount: value.incCount.map(item => item), incSize: value.incSize.map(item => item), decCount: value.decCount.map(item => item), decSize: value.decSize.map(item => item) };
}
