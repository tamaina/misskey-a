/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';

import { QueryService } from '../services/QueryService.js';
import { NoteEntityService } from '../serializers/NoteEntityService.js';
import { notesContract } from './notes.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateUgcVisibilityQueryForVisitor'>;
}
export function createNotesProcedure(deps: NotesDependencies) {
	return createApiProcedure<MiLocalUser>()(notesContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere('note.visibility = \'public\'')
						.andWhere('note.localOnly = FALSE')
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser');

					if (ps.local) {
						query.andWhere('note.userHost IS NULL');
					}

					if (me == null) deps.queryService.generateUgcVisibilityQueryForVisitor(query);

					if (ps.reply !== undefined) {
						query.andWhere(ps.reply ? 'note.replyId IS NOT NULL' : 'note.replyId IS NULL');
					}

					if (ps.renote !== undefined) {
						query.andWhere(ps.renote ? 'note.renoteId IS NOT NULL' : 'note.renoteId IS NULL');
					}

					if (ps.withFiles !== undefined) {
						query.andWhere(ps.withFiles ? 'note.fileIds != \'{}\'' : 'note.fileIds = \'{}\'');
					}

					if (ps.poll !== undefined) {
						query.andWhere(ps.poll ? 'note.hasPoll = TRUE' : 'note.hasPoll = FALSE');
					}

					// TODO
					//if (bot != undefined) {
					//	query.isBot = bot;
					//}

					const notes = await query.limit(ps.limit).getMany();

					return await deps.noteEntityService.packMany(notes);
			})();
			return result.map(toPackedNote);
		});
}
