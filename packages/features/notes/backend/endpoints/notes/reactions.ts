/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { toPackedNoteReaction } from '@features/notes/backend/note.schema.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

import { NoteReactionEntityService } from '../../serializers/NoteReactionEntityService.js';
import { NoteEntityService } from '../../serializers/NoteEntityService.js';
import { QueryService } from '../../services/QueryService.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { notesReactionsContract, notesReactionsErrors } from './reactions.contract.js';
import type { NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface NotesReactionsDependencies {
	noteReactionsRepository: NoteReactionsRepository;
	noteReactionEntityService: Pick<NoteReactionEntityService, 'packMany'>;
	noteEntityService: Pick<NoteEntityService, 'isVisibleForMe'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	getterService: Pick<GetterService, 'getNote'>;
}
export function createNotesReactionsProcedure(deps: NotesReactionsDependencies) {
	return createApiProcedure<MiLocalUser>()(notesReactionsContract).handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;

					const note = await deps.getterService.getNote(ps.noteId).catch((err: unknown) => {
						if (readErrorId(err) === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw apiError(notesReactionsErrors.noSuchNote);
						throw err;
					});

					if (!await deps.noteEntityService.isVisibleForMe(note, me ? me.id : null)) {
						throw apiError(notesReactionsErrors.noSuchNote);
					}

					const query = deps.queryService.makePaginationQuery(deps.noteReactionsRepository.createQueryBuilder('reaction'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
						.andWhere('reaction.noteId = :noteId', { noteId: note.id })
						.leftJoinAndSelect('reaction.user', 'user')
						.leftJoinAndSelect('reaction.note', 'note');

					if (ps.type) {
						// ローカルリアクションはホスト名が . とされているが
						// DB 上ではそうではないので、必要に応じて変換
						const suffix = '@.:';
						const type = ps.type.endsWith(suffix) ? ps.type.slice(0, ps.type.length - suffix.length) + ':' : ps.type;
						query.andWhere('reaction.reaction = :type', { type });
					}

					const reactions = await query.limit(ps.limit).getMany();

					return await deps.noteReactionEntityService.packMany(reactions, me);
			})();
			return result.map(toPackedNoteReaction);
		});
}
