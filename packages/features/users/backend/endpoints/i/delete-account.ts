/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { UserAuthService } from '@features/auth/backend/services/UserAuthService.js';
import { DI } from '@/di-symbols.js';
import { DeleteAccountService } from '../../services/DeleteAccountService.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import type { UsersInputs } from '../../api.contract.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';

@Injectable()
export class IDeleteAccountOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
		private deleteAccountService: DeleteAccountService,
	) {
	}

	async execute(ps: UsersInputs['i/delete-account'], me: MiLocalUser, _apiToken: ApiToken | null, _ip: string) {
		const token = ps.token;
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

		if (profile.twoFactorEnabled) {
			if (token == null) {
				throw new Error('authentication failed');
			}

			try {
				await this.userAuthService.twoFactorAuthenticate(profile, token);
			} catch (_) {
				throw new Error('authentication failed');
			}
		}

		const userDetailed = await this.usersRepository.findOneByOrFail({ id: me.id });
		if (userDetailed.isDeleted) {
			return;
		}

		const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
		if (!passwordMatched) {
			throw new Error('incorrect password');
		}

		await this.deleteAccountService.deleteAccount(me);
	}
}
