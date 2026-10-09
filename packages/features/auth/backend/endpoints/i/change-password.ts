/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { UserAuthService } from '../../services/UserAuthService.js';

import type * as v from 'valibot';
import type { IChangePasswordContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

@Injectable()
export class IChangePasswordOperation {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof IChangePasswordContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
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

		const passwordMatched = await bcrypt.compare(ps.currentPassword, profile.password!);

		if (!passwordMatched) {
			throw new Error('incorrect password');
		}

		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		const hash = await bcrypt.hash(ps.newPassword, salt);

		await this.userProfilesRepository.update(me.id, {
			password: hash,
		});
	}
}
