/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesThreadMutingDeleteContract, notesThreadMutingDeleteErrors } from './delete.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../../command.dependencies.js';
import { getCommandNote } from '../../../get-command-note.js';
import { readErrorId } from '../../../request.schema.js';
export function createNotesThreadMutingDeleteProcedure(deps: NotesCommandDependencies) {
	return createApiProcedure<MiLocalUser>()(notesThreadMutingDeleteContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, notesThreadMutingDeleteErrors.noSuchNote);
			await deps.deleteThreadMute(note.threadId ?? note.id, actor.id);
		});
}
