/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedUsersReactionsDefinition, packedUsersReactionsInput, packedUsersReactionsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, NoteReactionsRepository } from '@/models/_.js';

import { QueryService } from '@/core/QueryService.js';
import { NoteReactionEntityService } from '../../serializers/NoteReactionEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { UserEntityService } from '../../../../users/backend/serializers/UserEntityService.js';
import { RoleService } from '../../../../roles/backend/services/RoleService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedUsersReactionsDefinition);

export const meta = {
	tags: ['users', 'reactions'],

	requireCredential: false,

	description: 'Show all reactions this user made.',

	res: contractProjection.response,

	errors: {
		reactionsNotPublic: {
			message: 'Reactions of the user is not public.',
			code: 'REACTIONS_NOT_PUBLIC',
			id: '673a7dd2-6924-1093-e0c0-e68456ceae5c',
		},
		isRemoteUser: {
			message: 'Currently unavailable to display reactions of remote users. See https://github.com/misskey-dev/misskey/issues/12964',
			code: 'IS_REMOTE_USER',
			id: '6b95fa98-8cf9-2350-e284-f0ffdb54a805',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersReactionsInput, typeof packedUsersReactionsOutput> {
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
	) {
		super(meta, contractProjection, async (ps, me) => {
			const userIdsWhoBlockingMe = me ? await this.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();
			const iAmModerator = me ? await this.roleService.isModerator(me) : false; // Moderators can see reactions of all users
			if (!iAmModerator) {
				const user = await this.cacheService.findUserById(ps.userId);
				if (this.userEntityService.isRemoteUser(user)) {
					throw new ApiError(meta.errors.isRemoteUser);
				}

				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
				if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
					throw new ApiError(meta.errors.reactionsNotPublic);
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
		});
	}
}
