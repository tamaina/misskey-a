/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { UserAuthService } from '../../../services/UserAuthService.js';

import * as v from 'valibot';
import { emptyObjectI2faRemoveKeyInput } from '../../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '141c598d-a825-44c8-9173-cfb9d92be493',
		},
	},
} as const;

@Injectable()
export class I2faRemoveKeyOperation {
	constructor(
		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private userAuthService: UserAuthService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: v.InferOutput<typeof emptyObjectI2faRemoveKeyInput>, me: MiLocalUser) {
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

		const passwordMatched = await bcrypt.compare(ps.password, profile.password ?? '');
		if (!passwordMatched) {
			throw apiError(meta.errors.incorrectPassword);
		}

		// Make sure we only delete the user's own creds
		await this.userSecurityKeysRepository.delete({
			userId: me.id,
			id: ps.credentialId,
		});

		// 使われているキーがなくなったらパスワードレスログインをやめる
		const keyCount = await this.userSecurityKeysRepository.count({
			where: {
				userId: me.id,
			},
			select: {
				id: true,
				name: true,
				lastUsed: true,
			},
		});

		if (keyCount === 0) {
			await this.userProfilesRepository.update(me.id, {
				usePasswordLessLogin: false,
			});
		}

		// Publish meUpdated event
		this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.packSelf(me.id, {
			includeSecrets: true,
		}));

		return {};
	}
}
