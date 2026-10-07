/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedNotesMentionsDefinition, packedNotesMentionsInput, packedNotesMentionsOutput } from '../../../../../../features/timelines/contract/packed-endpoint-definitions.js';
import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, FollowingsRepository } from '@/models/_.js';

import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '../../../../../../features/notes/backend/serializers/NoteEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedNotesMentionsDefinition);

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof packedNotesMentionsInput, typeof packedNotesMentionsOutput> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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
		});
	}
}
