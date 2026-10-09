/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartNotesContract, chartNotesGetContract } from './notes.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../api.implementation.js';
export function createNotesProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['notes']) {
	return createApiProcedure<Actor>()(chartNotesContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}
export function createNotesGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['notes']) {
	return createApiProcedure<Actor>()(chartNotesGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['notes']['getChart']>>) {
	return { local: { total: value.local.total.map(item => item), inc: value.local.inc.map(item => item), dec: value.local.dec.map(item => item), diffs: { normal: value.local.diffs.normal.map(item => item), reply: value.local.diffs.reply.map(item => item), renote: value.local.diffs.renote.map(item => item), withFile: value.local.diffs.withFile.map(item => item) } }, remote: { total: value.remote.total.map(item => item), inc: value.remote.inc.map(item => item), dec: value.remote.dec.map(item => item), diffs: { normal: value.remote.diffs.normal.map(item => item), reply: value.remote.diffs.reply.map(item => item), renote: value.remote.diffs.renote.map(item => item), withFile: value.remote.diffs.withFile.map(item => item) } } };
}
