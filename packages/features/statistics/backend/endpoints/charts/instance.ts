/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartInstanceContract, chartInstanceGetContract } from './instance.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createInstanceProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['instance']) {
	return createApiProcedure<Actor>()(chartInstanceContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.host)));
}
export function createInstanceGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['instance']) {
	return createApiProcedure<Actor>()(chartInstanceGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.host)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['instance']['getChart']>>) {
	return { requests: { failed: value.requests.failed.map(item => item), succeeded: value.requests.succeeded.map(item => item), received: value.requests.received.map(item => item) }, notes: { total: value.notes.total.map(item => item), inc: value.notes.inc.map(item => item), dec: value.notes.dec.map(item => item), diffs: { normal: value.notes.diffs.normal.map(item => item), reply: value.notes.diffs.reply.map(item => item), renote: value.notes.diffs.renote.map(item => item), withFile: value.notes.diffs.withFile.map(item => item) } }, users: { total: value.users.total.map(item => item), inc: value.users.inc.map(item => item), dec: value.users.dec.map(item => item) }, following: { total: value.following.total.map(item => item), inc: value.following.inc.map(item => item), dec: value.following.dec.map(item => item) }, followers: { total: value.followers.total.map(item => item), inc: value.followers.inc.map(item => item), dec: value.followers.dec.map(item => item) }, drive: { totalFiles: value.drive.totalFiles.map(item => item), incFiles: value.drive.incFiles.map(item => item), decFiles: value.drive.decFiles.map(item => item), incUsage: value.drive.incUsage.map(item => item), decUsage: value.drive.decUsage.map(item => item) } };
}
