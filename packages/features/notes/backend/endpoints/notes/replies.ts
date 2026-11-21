/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';

import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesRepliesContract } from './replies.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesRepliesDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
}
export function createNotesRepliesProcedure(deps: NotesRepliesDependencies) {
	return createApiProcedure<MiLocalUser>()(notesRepliesContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere('note.replyId = :replyId', { replyId: ps.noteId })
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser');

					deps.queryService.generateVisibilityQuery(query, me);
					deps.queryService.generateBaseNoteFilteringQuery(query, me);

					const timeline = await query.limit(ps.limit).getMany();

					return await deps.noteEntityService.packMany(timeline, me);
			})();
			return result.map(toPackedNote);
		});
}
