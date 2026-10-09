/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { noteSearchContract } from './endpoints/noteSearch.contract.js';
import { createNotesSearchProcedure, type NotesSearchDependencies } from './endpoints/notes/search.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export type NoteSearchDependencies = NotesSearchDependencies;
export function createNoteSearchRouter<Actor extends MiLocalUser>(deps: NoteSearchDependencies) {
	return implement(noteSearchContract).$context<ApiContext<Actor>>().router({
		notesSearch: createNotesSearchProcedure<Actor>(deps),
	});
}
