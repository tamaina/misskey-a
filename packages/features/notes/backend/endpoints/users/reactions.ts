/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Inject, Injectable } from '@nestjs/common';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { isUserRelated } from '@features/relationships/backend/utility/is-user-related.js';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { NoteReactionEntityService } from '../../serializers/NoteReactionEntityService.js';
import { QueryService } from '../../services/QueryService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { usersReactionsContract, usersReactionsPolicy, usersReactionsInput, usersReactionsOutput, usersReactionsErrors } from './reactions.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { UserProfilesRepository, NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { NotesApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createUsersReactionsProcedure<Actor extends ApiActor>() {
	return implement(usersReactionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(usersReactionsPolicy))
		.handler(({ input, context }) => context.operations.notes.usersReactions(input, context.principal));
}

@Injectable()
export class UsersReactionsOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private noteReactionEntityService: NoteReactionEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {}
	async execute(ps: v.InferOutput<typeof usersReactionsInput>, me: MiLocalUser | null): Promise<v.InferOutput<typeof usersReactionsOutput>> {
		return v.parse(usersReactionsOutput, await this.run(ps, me));
	}

	private async run(ps: v.InferOutput<typeof usersReactionsInput>, me: MiLocalUser | null) {
		const userIdsWhoBlockingMe = me ? await this.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();
		const iAmModerator = me ? await this.roleService.isModerator(me) : false; // Moderators can see reactions of all users
		if (!iAmModerator) {
			const user = await this.cacheService.findUserById(ps.userId);
			if (this.userEntityService.isRemoteUser(user)) {
				throw apiError(usersReactionsErrors.isRemoteUser);
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
			if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
				throw apiError(usersReactionsErrors.reactionsNotPublic);
			}

			// early return if me is blocked by requesting user
			if (userIdsWhoBlockingMe.has(ps.userId)) {
				return [];
			}
		}

		const userIdsWhoMeMuting = me ? await this.cacheService.userMutingsCache.fetch(me.id) : new Set<string>();

		const query = this.queryService.makePaginationQuery(this.noteReactionsRepository.createQueryBuilder('reaction'),
			ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('reaction.userId = :userId', { userId: ps.userId })
			.leftJoinAndSelect('reaction.note', 'note')
			.leftJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateVisibilityQuery(query, me);
		this.queryService.generateBlockedHostQueryForNote(query);
		this.queryService.generateSuspendedUserQueryForNote(query);

		const reactions = (await query
			.limit(ps.limit)
			.getMany()).filter(reaction => {
			if (reaction.note?.userId === ps.userId) return true; // we can see reactions to note of requesting user
			if (me && isUserRelated(reaction.note, userIdsWhoBlockingMe)) return false;
			if (me && isUserRelated(reaction.note, userIdsWhoMeMuting)) return false;

			return true;
		});

		return await this.noteReactionEntityService.packManyWithNote(reactions, me);
	}
}
