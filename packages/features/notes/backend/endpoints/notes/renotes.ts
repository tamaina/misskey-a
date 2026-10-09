/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import * as v from 'valibot';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../services/QueryService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { notesRenotesContract, notesRenotesPolicy, notesRenotesErrors } from './renotes.contract.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesRenotesDependencies {
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBaseNoteFilteringQuery'>;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createNotesRenotesProcedure(deps: NotesRenotesDependencies) {
	return implement(notesRenotesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesRenotesPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesRenotesContract['~orpc'].outputSchema), await (async () => {
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
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
