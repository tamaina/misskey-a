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
import type { UserListsRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersListsUpdateOperation {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private userListEntityService: UserListEntityService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/update'], me: MiLocalUser) {
		const userList = await this.userListsRepository.findOneBy({
			id: ps.listId,
			userId: me.id,
		});

		if (userList == null) {
			throw apiError(relationshipsErrors['users/lists/update'].noSuchList);
		}

		await this.userListsRepository.update(userList.id, {
			name: ps.name,
			isPublic: ps.isPublic,
		});

		return await this.userListEntityService.pack(userList.id);
	}
}
