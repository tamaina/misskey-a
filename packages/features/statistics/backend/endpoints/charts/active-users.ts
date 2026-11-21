/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartActiveUsersContract, chartActiveUsersGetContract } from './active-users.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createActiveUsersProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['activeUsers']) {
	return createApiProcedure<Actor>()(chartActiveUsersContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createActiveUsersGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['activeUsers']) {
	return createApiProcedure<Actor>()(chartActiveUsersGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['activeUsers']['getChart']>>) {
	return { readWrite: value.readWrite.map(item => item), read: value.read.map(item => item), write: value.write.map(item => item), registeredWithinWeek: value.registeredWithinWeek.map(item => item), registeredWithinMonth: value.registeredWithinMonth.map(item => item), registeredWithinYear: value.registeredWithinYear.map(item => item), registeredOutsideWeek: value.registeredOutsideWeek.map(item => item), registeredOutsideMonth: value.registeredOutsideMonth.map(item => item), registeredOutsideYear: value.registeredOutsideYear.map(item => item) };
}
