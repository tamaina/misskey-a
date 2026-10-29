/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { maximum } from '@features/runtime/backend/data/array.js';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
const errors = {
	noSuchUser: {
		message: 'No such user.',
		code: 'NO_SUCH_USER',
		id: 'e6965129-7b2a-40a4-bae2-cd84cd434822',
	},
} as const;
export interface UsersGetFrequentlyRepliedUsersDependencies {
	notesRepository: NotesRepository;
	userEntityService: UserEntityService;
	queryService: QueryService;
	getterService: GetterService;
}
export function createUsersGetFrequentlyRepliedUsersProcedure<Actor extends MiLocalUser>(deps: UsersGetFrequentlyRepliedUsersDependencies) {
	const handler = async ({ input: ps, context: { principal: me } }: { input: DiscoveryInputs['users/get-frequently-replied-users']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		// Lookup user
		const user = await deps.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(errors.noSuchUser);
			throw err;
		});

		// Fetch recent notes
		const recentNotesQuery = deps.notesRepository.createQueryBuilder('note')
			.select(['note.id', 'note.replyId'])
			.where('note.userId = :userId', { userId: user.id })
			.andWhere('note.replyId IS NOT NULL')
			.orderBy('note.id', 'DESC')
			.limit(1000);

		// 対象ユーザー自身がリクエストしている場合、generateVisibilityQuery の
		// `note.userId = :meId` に必ず一致して常に真になるので、条件ごと省略する
		const isSelf = me != null && me.id === user.id;
		if (!isSelf) {
			deps.queryService.generateVisibilityQuery(recentNotesQuery, me);
		}

		const recentNotes = await recentNotesQuery.getMany();

		// 投稿が少なかったら中断
		if (recentNotes.length === 0) {
			return [];
		}

		// TODO ミュートを考慮
		const replyTargetNotesQuery = deps.notesRepository.createQueryBuilder('note')
			.select(['note.id', 'note.userId'])
			.where('note.id IN (:...replyIds)', { replyIds: recentNotes.map(p => p.replyId) });

		deps.queryService.generateVisibilityQuery(replyTargetNotesQuery, me);

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
		const _userMap = await deps.userEntityService.packMany(topRepliedUserIds, me, { schema: 'UserDetailed' })
			.then(users => new Map(users.map(u => [u.id, u])));
		const repliesObj = await Promise.all(topRepliedUserIds.map(async (userId) => ({
			user: _userMap.get(userId) ?? (await deps.userEntityService.pack(userId, me, { schema: 'UserDetailed' })),
			weight: repliedUsers[userId] / peak,
		})));
		return repliesObj.map(item => ({ user: toPackedUserDetailed(item.user), weight: item.weight }));
	};
	return createApiProcedure<Actor>()(discoveryContract['users/get-frequently-replied-users']).handler(handler);
}
