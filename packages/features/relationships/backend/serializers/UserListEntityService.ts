/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiUserListMembership, UserListMembershipsRepository, UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { } from '../models/Blocking.js';
import type { MiUserList } from '../models/UserList.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

export class UserListEntityService {
	constructor(
		private userListsRepository: UserListsRepository,

		private userListMembershipsRepository: UserListMembershipsRepository,

		private userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
		private idService: Pick<IdService, 'parse'>,
	) {
	}

	@bindThis
	public async pack(
		src: MiUserList['id'] | MiUserList,
	): Promise<Packed<'UserList'>> {
		const userList = typeof src === 'object' ? src : await this.userListsRepository.findOneByOrFail({ id: src });

		const users = await this.userListMembershipsRepository.findBy({
			userListId: userList.id,
		});

		return {
			id: userList.id,
			createdAt: this.idService.parse(userList.id).date.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId),
			isPublic: userList.isPublic,
		};
	}

	@bindThis
	public async packMembershipsMany(
		memberships: MiUserListMembership[],
	) {
		const _users = memberships.map(({ user, userId }) => user ?? userId);
		const _userMap = await this.userEntityService.packMany(_users)
			.then(users => new Map(users.map(u => [u.id, u])));
		return Promise.all(memberships.map(async x => ({
			id: x.id,
			createdAt: this.idService.parse(x.id).date.toISOString(),
			userId: x.userId,
			user: _userMap.get(x.userId) ?? await this.userEntityService.pack(x.userId),
			withReplies: x.withReplies,
		})));
	}
}
