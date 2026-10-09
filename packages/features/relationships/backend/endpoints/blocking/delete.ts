/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserBlockingService } from '../../services/UserBlockingService.js';

import { relationshipsErrors } from '../relationships.errors.js';
import type { UsersRepository, BlockingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { RelationshipsInputs } from '../relationships.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class BlockingDeleteOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userBlockingService: UserBlockingService,
	) {}

	async execute(ps: RelationshipsInputs['blocking/delete'], me: MiLocalUser) {
		const blocker = await this.usersRepository.findOneByOrFail({ id: me.id });

		// Check if the blockee is yourself
		if (me.id === ps.userId) {
			throw apiError(relationshipsErrors['blocking/delete'].blockeeIsYourself);
		}

		// Get blockee
		const blockee = await this.getterService.getUser(ps.userId).catch(err => {
			if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(relationshipsErrors['blocking/delete'].noSuchUser);
			throw err;
		});

		// Check not blocking
		const exist = await this.blockingsRepository.exists({
			where: {
				blockerId: blocker.id,
				blockeeId: blockee.id,
			},
		});

		if (!exist) {
			throw apiError(relationshipsErrors['blocking/delete'].notBlocking);
		}

		// Delete blocking
		await this.userBlockingService.unblock(blocker, blockee);

		return await this.userEntityService.pack(blockee.id, blocker, {
			schema: 'UserDetailedNotMe',
		});
	}
}
