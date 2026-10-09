/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import { chartPerUserNotesContract, chartPerUserNotesGetContract } from './notes.contract.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { StatisticsContext } from '../../../operations.js';

export function createPerUserNotesProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserNotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/notes' }))
		.handler(({ input, context }) => context.operations.statistics.userNotes(input, context.principal));
}

export function createPerUserNotesGetProcedure<Actor extends ApiActor>() {
	return implement(chartPerUserNotesGetContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<StatisticsContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'charts/user/notes' }))
		.use(decodeScalarInput<Actor>({ limit: 'integer', offset: 'integer' }))
		.handler(({ input, context }) => context.operations.statistics.userNotes(input, context.principal));
}
