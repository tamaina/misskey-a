/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

import type { notesMentionsContract } from '../../endpoints/notes/mentions.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import type { NotesRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class NotesMentionsApplicationService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof notesMentionsContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const followingQuery = this.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: me.id });

		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
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

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBaseNoteFilteringQuery(query, me);
		this.queryService.generateMutedNoteThreadQuery(query, me);

		if (ps.visibility) {
			query.andWhere('note.visibility = :visibility', { visibility: ps.visibility });
		}

		if (ps.following) {
			query.andWhere(`((note.userId IN (${ followingQuery.getQuery() })) OR (note.userId = :meId))`, { meId: me.id });
			query.setParameters(followingQuery.getParameters());
		}

		const mentions = await query.limit(ps.limit).getMany();

		return await this.noteEntityService.packMany(mentions, me);
	}
}
