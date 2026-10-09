/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../serializers/UserEntityService.js';
import { iErrors } from './i.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class IOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
	}

	async execute(_ps: UsersInputs['i'], user: MiLocalUser, token: ApiToken | null, _ip: string) {
		const isSecure = token == null;

		const now = new Date();
		const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

		// 渡ってきている user はキャッシュされていて古い可能性があるので改めて取得
		const userProfile = await this.userProfilesRepository.findOne({
			where: {
				userId: user.id,
			},
			relations: { user: true },
		});

		if (userProfile == null || userProfile.user === null) {
			throw apiError(iErrors.userIsDeleted);
		}

		if (!userProfile.loggedInDates.includes(today)) {
			this.userProfilesRepository.update({ userId: user.id }, {
				loggedInDates: [...userProfile.loggedInDates, today],
			});
			userProfile.loggedInDates = [...userProfile.loggedInDates, today];
		}

		return await this.userEntityService.packSelf(userProfile.user, {
			includeSecrets: isSecure,
			userProfile,
		});
	}
}
