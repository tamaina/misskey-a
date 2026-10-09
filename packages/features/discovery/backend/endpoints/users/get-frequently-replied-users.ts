/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import { maximum } from '@features/runtime/backend/data/array.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

const errors = {
		noSuchUser: {
		message: 'No such user.',
		code: 'NO_SUCH_USER',
		id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
		},
	} as const;

@Injectable()
export class UsersGetFrequentlyRepliedUsersOperation {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {
	}

	async execute(ps: DiscoveryInputs['users/get-frequently-replied-users'], me: MiLocalUser | null) {
		// Lookup user
		const user = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(errors.noSuchUser);
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

		const repliedUsers: Record<string, number> = {};

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
	}
}
