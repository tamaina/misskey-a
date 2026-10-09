/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../operations.js';
import { chartNotesContract, chartNotesGetContract } from './notes.contract.js';

export function createNotesProcedure<Actor extends ApiActor>() {
	return implement(chartNotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/notes' }))
		.handler(({ input, context }) => context.operations.statistics.notes(input, context.principal));
}

export function createNotesGetProcedure<Actor extends ApiActor>() {
	return implement(chartNotesGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/notes' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.notes(input, context.principal));
}
