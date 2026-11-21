/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { MiMeta } from '@features/instance/backend/models/Meta.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';

import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { notesShowContract, notesShowErrors } from './show.contract.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesShowDependencies {
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'pack'>;
	getterService: Pick<GetterService, 'getNoteWithRelations'>;
}
export function createNotesShowProcedure(deps: NotesShowDependencies) {
	return createApiProcedure<MiLocalUser>()(notesShowContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const note = await deps.getterService.getNoteWithRelations(ps.noteId).catch((err: unknown) => {
						if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesShowErrors.noSuchNote);
						throw err;
					});

					if (note.user!.requireSigninToViewContents && me == null) {
						throw apiError(notesShowErrors.contentRestrictedByUser);
					}

					if (deps.serverSettings.ugcVisibilityForVisitor === 'none' && me == null) {
						throw apiError(notesShowErrors.contentRestrictedByServer);
					}

					if (deps.serverSettings.ugcVisibilityForVisitor === 'local' && note.userHost != null && me == null) {
						throw apiError(notesShowErrors.contentRestrictedByServer);
					}

					return await deps.noteEntityService.pack(note, me, {
						detail: true,
					});
			})();
			return toPackedNote(result);
		});
}
