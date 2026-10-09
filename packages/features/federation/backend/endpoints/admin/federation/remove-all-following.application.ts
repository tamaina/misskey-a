/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, UsersRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminFederationRemoveAllFollowingInput, adminFederationRemoveAllFollowingOutput } from './remove-all-following.contract.js';

@Injectable()
export class AdminFederationRemoveAllFollowingApplicationService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private followingsRepository: FollowingsRepository,

		private queueService: QueueService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminFederationRemoveAllFollowingInput>, _me: MiUser): Promise<v.InferOutput<typeof adminFederationRemoveAllFollowingOutput>> {
		const result = await (async () => {
			const followings = await this.followingsRepository.findBy({
				followerHost: ps.host,
			});

			const pairs = await Promise.all(followings.map(f => Promise.all([
				this.usersRepository.findOneByOrFail({ id: f.followerId }),
				this.usersRepository.findOneByOrFail({ id: f.followeeId }),
			]).then(([from, to]) => [{ id: from.id }, { id: to.id }])));

			this.queueService.createUnfollowJob(pairs.map(p => ({ from: p[0], to: p[1], silent: true })));
		})();
		return v.parse(adminFederationRemoveAllFollowingOutput, result);
	}
}
