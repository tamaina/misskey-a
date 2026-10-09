/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';
import { UserListService } from '../../../services/UserListService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
import type { UserListsRepository, UserListMembershipsRepository, BlockingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersListsCreateFromPublicOperation {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userListService: UserListService,
		private userListEntityService: UserListEntityService,
		private idService: IdService,
		private getterService: GetterService,
		private roleService: RoleService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/create-from-public'], me: MiLocalUser) {
		const listExist = await this.userListsRepository.exists({
			where: {
				id: ps.listId,
				isPublic: true,
			},
		});
		if (!listExist) throw apiError(relationshipsErrors['users/lists/create-from-public'].noSuchList);
		const currentCount = await this.userListsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).userListLimit) {
			throw apiError(relationshipsErrors['users/lists/create-from-public'].tooManyUserLists);
		}

		const userList = await this.userListsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			name: ps.name,
		});

		const users = (await this.userListMembershipsRepository.findBy({
			userListId: ps.listId,
		})).map(x => x.userId);

		for (const user of users) {
			const currentUser = await this.getterService.getUser(user).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['users/lists/create-from-public'].noSuchUser);
				throw err;
			});

			if (currentUser.id !== me.id) {
				const blockExist = await this.blockingsRepository.exists({
					where: {
						blockerId: currentUser.id,
						blockeeId: me.id,
					},
				});
				if (blockExist) {
					throw apiError(relationshipsErrors['users/lists/create-from-public'].youHaveBeenBlocked);
				}
			}

			const exist = await this.userListMembershipsRepository.exists({
				where: {
					userListId: userList.id,
					userId: currentUser.id,
				},
			});

			if (exist) {
				throw apiError(relationshipsErrors['users/lists/create-from-public'].alreadyAdded);
			}

			try {
				await this.userListService.addMember(currentUser, userList, me);
			} catch (err) {
				if (err instanceof UserListService.TooManyUsersError) {
					throw apiError(relationshipsErrors['users/lists/create-from-public'].tooManyUsers);
				}
				throw err;
			}
		}
		return await this.userListEntityService.pack(userList);
	}
}
