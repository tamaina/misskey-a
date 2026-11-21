/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { notesConversationContract, notesConversationErrors } from './conversation.contract.js';
import type { MiNote } from '../../models/Note.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesConversationDependencies {
	notesRepository: NotesRepository;
	serverSettings: MiMeta;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createNotesConversationProcedure(deps: NotesConversationDependencies) {
	return createApiProcedure<MiLocalUser>()(notesConversationContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					if (me == null && deps.serverSettings.ugcVisibilityForVisitor === 'none') return [];

					const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
						if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesConversationErrors.noSuchNote);
						throw err;
					});

					const conversation: MiNote[] = [];
					let i = 0;

					const get = async (id: string): Promise<void> => {
						i++;
						const p = await deps.notesRepository.findOneBy({ id });
						if (p == null) return;

						if (i > ps.offset) {
							conversation.push(p);
						}

						if (conversation.length === ps.limit) {
							return;
						}

						if (p.replyId) {
							await get(p.replyId);
						}
					};

					if (note.replyId) {
						await get(note.replyId);
					}

					return await deps.noteEntityService.packMany(conversation, me);
			})();
			return result.map(toPackedNote);
		});
}
