/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class UsersAchievementsOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,
	) {
	}

	async execute(ps: UsersInputs['users/achievements'], _me: MiLocalUser | null, _token: ApiToken | null, _ip: string) {
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });

		return profile.achievements;
	}
}
