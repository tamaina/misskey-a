/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';

import { relationshipsErrors } from '../../relationships.errors.js';
import type { UserListsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class UsersListsListOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private userListEntityService: UserListEntityService,
	) {}

	async execute(ps: RelationshipsInputs['users/lists/list'], me: MiLocalUser | null) {
		if (typeof ps.userId !== 'undefined') {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user === null) throw apiError(relationshipsErrors['users/lists/list'].noSuchUser);
			if (user.host !== null) throw apiError(relationshipsErrors['users/lists/list'].remoteUser);
		} else if (me === null) {
			throw apiError(relationshipsErrors['users/lists/list'].invalidParam);
		}

		const userLists = await this.userListsRepository.findBy(typeof ps.userId === 'undefined' && me !== null ? {
			userId: me.id,
		} : {
			userId: ps.userId,
			isPublic: true,
		});

		return await Promise.all(userLists.map(x => this.userListEntityService.pack(x)));
	}
}
