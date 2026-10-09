/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, PasswordResetRequestsRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import * as v from 'valibot';
import { voidResetPasswordInput } from '../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Complete the password reset that was previously requested.',

	errors: {

	},
} as const;

@Injectable()
export class ResetPasswordOperation {
	constructor(
		@Inject(DI.passwordResetRequestsRepository)
		private passwordResetRequestsRepository: PasswordResetRequestsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof voidResetPasswordInput>, me: MiLocalUser | null) {
		const req = await this.passwordResetRequestsRepository.findOneByOrFail({
			token: ps.token,
		});

		// 発行してから30分以上経過していたら無効
		if (Date.now() - this.idService.parse(req.id).date.getTime() > 1000 * 60 * 30) {
			throw new Error(); // TODO
		}

		// Generate hash of password
		const salt = await bcrypt.genSalt(8);
		const hash = await bcrypt.hash(ps.password, salt);

		await this.userProfilesRepository.update(req.userId, {
			password: hash,
		});

		this.passwordResetRequestsRepository.delete(req.id);
	}
}
