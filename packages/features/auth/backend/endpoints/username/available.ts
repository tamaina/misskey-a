/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, UsedUsernamesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { remainingUsernameAvailableInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,
} as const;

@Injectable()
export class UsernameAvailableOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,
	) {}

	async execute(ps: v.InferOutput<typeof remainingUsernameAvailableInput>, me: MiLocalUser | null) {
		const exist = await this.usersRepository.countBy({
			host: IsNull(),
			usernameLower: ps.username.toLowerCase(),
		});

		const exist2 = await this.usedUsernamesRepository.countBy({ username: ps.username.toLowerCase() });

		const isPreserved = this.serverSettings.preservedUsernames.map(x => x.toLowerCase()).includes(ps.username.toLowerCase());

		return {
			available: exist === 0 && exist2 === 0 && !isPreserved,
		};
	}
}
