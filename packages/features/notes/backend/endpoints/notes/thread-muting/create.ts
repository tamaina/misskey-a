/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { notesThreadMutingCreateContract, notesThreadMutingCreateErrors } from './create.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesCommandDependencies } from '../../../command.dependencies.js';
import { getCommandNote } from '../../../get-command-note.js';
import { readErrorId } from '../../../request.schema.js';
export function createNotesThreadMutingCreateProcedure(deps: NotesCommandDependencies) {
	return createApiProcedure<MiLocalUser>()(notesThreadMutingCreateContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const note = await getCommandNote(deps, input.noteId, notesThreadMutingCreateErrors.noSuchNote);
			const threadId = note.threadId ?? note.id;
			if (await deps.threadMuteExists(threadId, actor.id)) {
				throw deps.createError(notesThreadMutingCreateErrors.alreadyMuting);
			}
			await deps.insertThreadMute(deps.newId(), threadId, actor.id);
		});
}
