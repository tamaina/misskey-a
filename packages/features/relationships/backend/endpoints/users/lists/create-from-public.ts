/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toPackedUserList } from '../../relationships.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { relationshipsContract } from '../../relationships.contract.js';
import type { RelationshipsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserListService } from '../../../services/UserListService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
export function createUsersListsCreateFromPublicProcedure<Actor extends MiLocalUser>(deps: Pick<RelationshipsDependencies, 'userListsRepository' | 'roleService' | 'idService' | 'userListMembershipsRepository' | 'getterService' | 'blockingsRepository' | 'userListService' | 'userListEntityService'>) {
	return createApiProcedure<Actor>()(relationshipsContract["users/lists/create-from-public"]).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const listExist = await deps.userListsRepository.exists({
				where: {
					id: ps.listId,
					isPublic: true,
				},
			});
			if (!listExist) throw apiError(relationshipsErrors['users/lists/create-from-public'].noSuchList);
			const currentCount = await deps.userListsRepository.countBy({
				userId: me.id,
			});
			if (currentCount >= (await deps.roleService.getUserPolicies(me.id)).userListLimit) {
				throw apiError(relationshipsErrors['users/lists/create-from-public'].tooManyUserLists);
			}

			const userList = await deps.userListsRepository.insertOne({
				id: deps.idService.gen(),
				userId: me.id,
				name: ps.name,
			});

			const users = (await deps.userListMembershipsRepository.findBy({
				userListId: ps.listId,
			})).map(x => x.userId);

			for (const user of users) {
				const currentUser = await deps.getterService.getUser(user).catch(err => {
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['users/lists/create-from-public'].noSuchUser);
					throw err;
				});

				if (currentUser.id !== me.id) {
					const blockExist = await deps.blockingsRepository.exists({
						where: {
							blockerId: currentUser.id,
							blockeeId: me.id,
						},
					});
					if (blockExist) {
						throw apiError(relationshipsErrors['users/lists/create-from-public'].youHaveBeenBlocked);
					}
				}

				const exist = await deps.userListMembershipsRepository.exists({
					where: {
						userListId: userList.id,
						userId: currentUser.id,
					},
				});

				if (exist) {
					throw apiError(relationshipsErrors['users/lists/create-from-public'].alreadyAdded);
				}

				try {
					await deps.userListService.addMember(currentUser, userList, me);
				} catch (err) {
					if (err instanceof UserListService.TooManyUsersError) {
						throw apiError(relationshipsErrors['users/lists/create-from-public'].tooManyUsers);
					}
					throw err;
				}
			}
			return toPackedUserList(await deps.userListEntityService.pack(userList));
		});
}
