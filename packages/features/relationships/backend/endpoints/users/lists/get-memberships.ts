/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
import type { UserListsRepository, UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersListsGetMembershipsOperation {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userListEntityService: UserListEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/get-memberships'], me: MiLocalUser | null) {
		// Fetch the list
		const userList = await this.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
			id: ps.listId,
			userId: me.id,
		} : {
			id: ps.listId,
			isPublic: true,
		});

		if (userList == null) {
			throw apiError(relationshipsErrors['users/lists/get-memberships'].noSuchList);
		}

		const query = this.queryService.makePaginationQuery(this.userListMembershipsRepository.createQueryBuilder('membership'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('membership.userListId = :userListId', { userListId: userList.id })
			.innerJoinAndSelect('membership.user', 'user');

		const memberships = await query
			.limit(ps.limit)
			.getMany();

		return this.userListEntityService.packMembershipsMany(memberships);
	}
}
