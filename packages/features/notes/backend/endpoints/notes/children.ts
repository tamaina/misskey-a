/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { Brackets } from 'typeorm';

import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesChildrenContract } from './children.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesChildrenDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
}
export function createNotesChildrenProcedure(deps: NotesChildrenDependencies) {
	return createApiProcedure<MiLocalUser>()(notesChildrenContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere(new Brackets(qb => {
							qb
								.where('note.replyId = :noteId', { noteId: ps.noteId })
								.orWhere(new Brackets(qb => {
									qb
										.where('note.renoteId = :noteId', { noteId: ps.noteId })
										.andWhere(new Brackets(qb => {
											qb
												.where('note.text IS NOT NULL')
												.orWhere('note.fileIds != \'{}\'')
												.orWhere('note.hasPoll = TRUE');
										}));
								}));
						}))
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser');

					deps.queryService.generateVisibilityQuery(query, me);
					deps.queryService.generateBaseNoteFilteringQuery(query, me);

					const notes = await query.limit(ps.limit).getMany();

					return await deps.noteEntityService.packMany(notes, me);
			})();
			return result.map(toPackedNote);
		});
}
