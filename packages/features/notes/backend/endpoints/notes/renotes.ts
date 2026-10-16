/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { notesRenotesContract, notesRenotesErrors } from './renotes.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesRenotesDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createNotesRenotesProcedure(deps: NotesRenotesDependencies) {
	return createApiProcedure<MiLocalUser>()(notesRenotesContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
						if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesRenotesErrors.noSuchNote);
						throw err;
					});

					const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere('note.renoteId = :renoteId', { renoteId: note.id })
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser');

					deps.queryService.generateVisibilityQuery(query, me);
					deps.queryService.generateBaseNoteFilteringQuery(query, me);

					const renotes = await query.limit(ps.limit).getMany();

					return await deps.noteEntityService.packMany(renotes, me);
			})();
			return result.map(toPackedNote);
		});
}
