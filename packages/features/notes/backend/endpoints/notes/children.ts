/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { Brackets } from 'typeorm';
import * as v from 'valibot';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { notesChildrenContract, notesChildrenPolicy } from './children.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesChildrenDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
}
export function createNotesChildrenProcedure(deps: NotesChildrenDependencies) {
	return implement(notesChildrenContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesChildrenPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesChildrenContract['~orpc'].outputSchema), await (async () => {
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
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
