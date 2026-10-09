/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import type { UsersRepository, UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { generateNativeUserToken } from '../../utility/token.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

import type * as v from 'valibot';
import type { IRegenerateTokenContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

@Injectable()
export class IRegenerateTokenOperation {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof IRegenerateTokenContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const freshUser = await this.usersRepository.findOneByOrFail({ id: me.id });
		const oldToken = freshUser.token!;

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

		// Compare password
		const same = await bcrypt.compare(ps.password, profile.password!);

		if (!same) {
			throw new Error('incorrect password');
		}

		const newToken = generateNativeUserToken();

		await this.usersRepository.update(me.id, {
			token: newToken,
		});

		// Publish event
		this.globalEventService.publishInternalEvent('userTokenRegenerated', { id: me.id, oldToken, newToken });
		this.globalEventService.publishMainStream(me.id, 'myTokenRegenerated');
	}
}
