/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesUnrenoteContract, notesUnrenoteErrors, notesUnrenotePolicy } from './unrenote.contract.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../command.dependencies.js';
import { getCommandNote } from '../../get-command-note.js';
import { readErrorId } from '../../request.schema.js';
export function createNotesUnrenoteProcedure(deps: NotesCommandDependencies) {
	return implement(notesUnrenoteContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesUnrenotePolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, notesUnrenoteErrors.noSuchNote);
			const renotes = await deps.findRenotesByUserAndRenote(actor.id, note.id);
			for (const renote of renotes) {
				const author = await deps.findUserByIdOrFail(actor.id);
				// This was deliberately fire-and-forget in the legacy handler.
				deps.deleteNote(author, renote);
			}
		});
}
