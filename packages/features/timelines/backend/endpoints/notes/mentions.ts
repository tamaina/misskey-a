/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { notesMentionsContract } from './mentions.contract.js';
import { Brackets } from 'typeorm';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesMentionsDependencies {
	notesRepository: NotesRepository;
	followingsRepository: FollowingsRepository;
	noteEntityService: NoteEntityService;
	queryService: QueryService;
}
export function createNotesMentionsProcedure<Actor extends MiLocalUser>(deps: NotesMentionsDependencies) {
	return implement(notesMentionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: notesMentionsContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const followingQuery = deps.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });
			const query = deps.queryService.makePaginationQuery(deps.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere(new Brackets(qb => {
					qb // このmeIdAsListパラメータはqueryServiceのgenerateVisibilityQueryでセットされる
						.where(':meIdAsList <@ note.mentions')
						.orWhere(':meIdAsList <@ note.visibleUserIds');
				}))
				// Avoid scanning primary key index
				.orderBy('CONCAT(note.id)', (ps.sinceDate || ps.sinceId) ? 'ASC' : 'DESC')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');
			deps.queryService.generateVisibilityQuery(query, me);
			deps.queryService.generateBaseNoteFilteringQuery(query, me);
			deps.queryService.generateMutedNoteThreadQuery(query, me);
			if (ps.visibility) {
				query.andWhere('note.visibility = :visibility', { visibility: ps.visibility });
			}
			if (ps.following) {
				query.andWhere(`((note.userId IN (${followingQuery.getQuery()})) OR (note.userId = :meId))`, { meId: me.id });
				query.setParameters(followingQuery.getParameters());
			}
			const mentions = await query.limit(ps.limit).getMany();
			return await deps.noteEntityService.packMany(mentions, me);
		});
}
