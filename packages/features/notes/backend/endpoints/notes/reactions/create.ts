/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesReactionsCreateContract, notesReactionsCreateErrors } from './create.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../../command.dependencies.js';
import { getCommandNote } from '../../../get-command-note.js';
import { readErrorId } from '../../../request.schema.js';
export function createNotesReactionsCreateProcedure(deps: NotesCommandDependencies) {
	return createApiProcedure<MiLocalUser>()(notesReactionsCreateContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, notesReactionsCreateErrors.noSuchNote);
			try {
				await deps.createReaction(actor, note, input.reaction);
			} catch (error) {
				const errorId = readErrorId(error);
				if (errorId === '51c42bb4-931a-456b-bff7-e5a8a70dd298') {
					throw deps.createError(notesReactionsCreateErrors.alreadyReacted);
				}
				if (errorId === 'e70412a4-7197-4726-8e74-f3e0deb92aa7') {
					throw deps.createError(notesReactionsCreateErrors.youHaveBeenBlocked);
				}
				if (errorId === '12c35529-3c79-4327-b1cc-e2cf63a71925') {
					throw deps.createError(notesReactionsCreateErrors.cannotReactToRenote);
				}
				throw error;
			}
		});
}
