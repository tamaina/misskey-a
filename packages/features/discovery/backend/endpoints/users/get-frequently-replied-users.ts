/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedUsersGetFrequentlyRepliedUsersDefinition, packedUsersGetFrequentlyRepliedUsersInput, packedUsersGetFrequentlyRepliedUsersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { maximum } from '@/misc/prelude/array.js';
import type { NotesRepository } from '@/models/_.js';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedUsersGetFrequentlyRepliedUsersDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Get a list of other users that the specified user frequently replies to.',

	res: contractProjection.response,

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersGetFrequentlyRepliedUsersInput, typeof packedUsersGetFrequentlyRepliedUsersOutput> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Lookup user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Fetch recent notes
			const recentNotesQuery = this.notesRepository.createQueryBuilder('note')
				.select(['note.id', 'note.replyId'])
				.where('note.userId = :userId', { userId: user.id })
				.andWhere('note.replyId IS NOT NULL')
				.orderBy('note.id', 'DESC')
				.limit(1000);

			// 対象ユーザー自身がリクエストしている場合、generateVisibilityQuery の
			// `note.userId = :meId` に必ず一致して常に真になるので、条件ごと省略する
			const isSelf = me != null && me.id === user.id;
			if (!isSelf) {
				this.queryService.generateVisibilityQuery(recentNotesQuery, me);
			}

			const recentNotes = await recentNotesQuery.getMany();

			// 投稿が少なかったら中断
			if (recentNotes.length === 0) {
				return [];
			}

			// TODO ミュートを考慮
			const replyTargetNotesQuery = this.notesRepository.createQueryBuilder('note')
				.select(['note.id', 'note.userId'])
				.where('note.id IN (:...replyIds)', { replyIds: recentNotes.map(p => p.replyId) });

			this.queryService.generateVisibilityQuery(replyTargetNotesQuery, me);

			const replyTargetNotes = await replyTargetNotesQuery.getMany();

			const repliedUsers: any = {};

			// Extract replies from recent notes
			for (const userId of replyTargetNotes.map(x => x.userId.toString())) {
				if (repliedUsers[userId]) {
					repliedUsers[userId]++;
				} else {
					repliedUsers[userId] = 1;
				}
			}

			// Calc peak
			const peak = maximum(Object.values(repliedUsers));

			// Sort replies by frequency
			const repliedUsersSorted = Object.keys(repliedUsers).sort((a, b) => repliedUsers[b] - repliedUsers[a]);

			// Extract top replied users
			const topRepliedUserIds = repliedUsersSorted.slice(0, ps.limit);

			// Make replies object (includes weights)
			const _userMap = await this.userEntityService.packMany(topRepliedUserIds, me, { schema: 'UserDetailed' })
				.then(users => new Map(users.map(u => [u.id, u])));
			const repliesObj = await Promise.all(topRepliedUserIds.map(async (userId) => ({
				user: _userMap.get(userId) ?? (await this.userEntityService.pack(userId, me, { schema: 'UserDetailed' })),
				weight: repliedUsers[userId] / peak,
			})));

			return repliesObj;
		});
	}
}
