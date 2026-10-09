/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DI } from '@/di-symbols.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
import type { UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersListsCreateOperation {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private userListEntityService: UserListEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/create'], me: MiLocalUser) {
		const currentCount = await this.userListsRepository.countBy({
			userId: me.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).userListLimit) {
			throw apiError(relationshipsErrors['users/lists/create'].tooManyUserLists);
		}

		const userList = await this.userListsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			name: ps.name,
		});

		return await this.userListEntityService.pack(userList);
	}
}
