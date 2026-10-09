/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { notesSearchContract } from './search.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { NoteSearchContext } from '../../operations.js';

export function createNotesSearchProcedure<Actor extends ApiActor>() {
	return implement(notesSearchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NoteSearchContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'notes/search' }))
		.handler(({ input, context }) => context.operations.noteSearch.notesSearch(input, context.principal));
}
