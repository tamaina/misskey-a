/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';
import { relationshipsErrors } from '../../relationships.errors.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { UserListsRepository, UserListFavoritesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersListsShowOperation {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,

		private userListEntityService: UserListEntityService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/show'], me: MiLocalUser | null) {
		const additionalProperties: Partial<{ likedCount: number, isLiked: boolean }> = {};
		// Fetch the list
		const userList = await this.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
			id: ps.listId,
			userId: me.id,
		} : {
			id: ps.listId,
			isPublic: true,
		});

		if (userList == null) {
			throw apiError(relationshipsErrors['users/lists/show'].noSuchList);
		}

		if (ps.forPublic && userList.isPublic) {
			additionalProperties.likedCount = await this.userListFavoritesRepository.countBy({
				userListId: ps.listId,
			});
			if (me !== null) {
				additionalProperties.isLiked = await this.userListFavoritesRepository.exists({
					where: {
						userId: me.id,
						userListId: ps.listId,
					},
				});
			} else {
				additionalProperties.isLiked = false;
			}
		}
		return {
			...await this.userListEntityService.pack(userList),
			...additionalProperties,
		};
	}
}
