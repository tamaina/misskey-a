/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { isUserRelated } from '@features/relationships/backend/utility/is-user-related.js';
import * as v from 'valibot';
import { NoteReactionEntityService } from '../../serializers/NoteReactionEntityService.js';
import { QueryService } from '../../services/QueryService.js';
import { authentication, apiPolicy } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { usersReactionsContract, usersReactionsPolicy, usersReactionsErrors } from './reactions.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { UserProfilesRepository, NoteReactionsRepository } from '@features/persistence/backend/repositories/models.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface UsersReactionsDependencies {
	userProfilesRepository: UserProfilesRepository;
	noteReactionsRepository: NoteReactionsRepository;
	cacheService: Pick<CacheService, 'userBlockedCache' | 'findUserById' | 'userMutingsCache'>;
	userEntityService: Pick<UserEntityService, 'isRemoteUser'>;
	noteReactionEntityService: Pick<NoteReactionEntityService, 'packManyWithNote'>;
	queryService: Pick<QueryService, 'makePaginationQuery' | 'generateVisibilityQuery' | 'generateBlockedHostQueryForNote' | 'generateSuspendedUserQueryForNote'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createUsersReactionsProcedure(deps: UsersReactionsDependencies) {
	return implement(usersReactionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(usersReactionsPolicy))
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(usersReactionsContract['~orpc'].outputSchema), await (async () => {
				const userIdsWhoBlockingMe = me ? await deps.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();
				const iAmModerator = me ? await deps.roleService.isModerator(me) : false; // Moderators can see reactions of all users
				if (!iAmModerator) {
					const user = await deps.cacheService.findUserById(ps.userId);
					if (deps.userEntityService.isRemoteUser(user)) {
						throw apiError(usersReactionsErrors.isRemoteUser);
					}

					const profile = await deps.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
					if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
						throw apiError(usersReactionsErrors.reactionsNotPublic);
					}

					// early return if me is blocked by requesting user
					if (userIdsWhoBlockingMe.has(ps.userId)) {
						return [];
					}
				}

				const userIdsWhoMeMuting = me ? await deps.cacheService.userMutingsCache.fetch(me.id) : new Set<string>();

				const query = deps.queryService.makePaginationQuery(deps.noteReactionsRepository.createQueryBuilder('reaction'),
					ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('reaction.userId = :userId', { userId: ps.userId })
					.leftJoinAndSelect('reaction.note', 'note')
					.leftJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('renote.user', 'renoteUser');

				deps.queryService.generateVisibilityQuery(query, me);
				deps.queryService.generateBlockedHostQueryForNote(query);
				deps.queryService.generateSuspendedUserQueryForNote(query);

				const reactions = (await query
					.limit(ps.limit)
					.getMany()).filter(reaction => {
						if (reaction.note?.userId === ps.userId) return true; // we can see reactions to note of requesting user
						if (me && isUserRelated(reaction.note, userIdsWhoBlockingMe)) return false;
						if (me && isUserRelated(reaction.note, userIdsWhoMeMuting)) return false;

						return true;
					});

				return await deps.noteReactionEntityService.packManyWithNote(reactions, me);
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
