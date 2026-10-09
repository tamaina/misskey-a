/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { noteSearchContract } from './endpoints/noteSearch.contract.js';
import { createNotesSearchProcedure } from './endpoints/notes/search.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { NoteSearchContext } from './operations.js';

export function createNoteSearchRouter<Actor extends ApiActor>() {
	return implement(noteSearchContract).$context<NoteSearchContext<Actor>>().router({
		notesSearch: createNotesSearchProcedure<Actor>(),
	});
}
