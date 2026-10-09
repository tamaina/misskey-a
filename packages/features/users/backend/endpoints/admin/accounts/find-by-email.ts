/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../../../serializers/UserEntityService.js';
import { adminAccountsFindByEmailErrors } from './find-by-email.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class AdminAccountsFindByEmailOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
	}

	async execute(ps: UsersInputs['admin/accounts/find-by-email'], _me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		const profile = await this.userProfilesRepository.findOne({
			where: { email: ps.email },
			relations: { user: true },
		});

		if (profile == null || profile.user === null) {
			throw apiError(adminAccountsFindByEmailErrors.userNotFound);
		}

		const res = await this.userEntityService.pack(profile.user, null, {
			schema: 'UserDetailedNotMe',
		});

		return res;
	}
}
