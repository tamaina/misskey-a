/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import { chartPerUserNotesContract, chartPerUserNotesGetContract } from './notes.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { StatisticsDependencies } from '../../../api.implementation.js';
export function createPerUserNotesProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userNotes']) {
	return createApiProcedure<Actor>()(chartPerUserNotesContract)
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}
export function createPerUserNotesGetProcedure<Actor extends ApiActor>(deps: StatisticsDependencies['charts']['userNotes']) {
	return createApiProcedure<Actor>()(chartPerUserNotesGetContract)
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(async ({ input }) => projectChart(await deps.getChart(input.span, input.limit, input.offset ? new Date(input.offset) : null, input.userId)));
}

function projectChart(value: Awaited<ReturnType<StatisticsDependencies['charts']['userNotes']['getChart']>>) {
	return { total: value.total.map(item => item), inc: value.inc.map(item => item), dec: value.dec.map(item => item), diffs: { normal: value.diffs.normal.map(item => item), reply: value.diffs.reply.map(item => item), renote: value.diffs.renote.map(item => item), withFile: value.diffs.withFile.map(item => item) } };
}
