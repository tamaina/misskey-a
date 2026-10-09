/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../models/UserSecurityKey.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

import type * as v from 'valibot';
import type { AdminUnsetMfaContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unset-mfa',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'ccafc7fe-5074-4edd-9dc0-8ef9ef6a701d',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'cda8f8ce-89a6-4f92-8055-33bbe0c1464d',
		},
	},
} as const;

@Injectable()
export class AdminUnsetMfaOperation {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof AdminUnsetMfaContract['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const user = await this.usersRepository.findOneBy({ id: ps.userId });

		if (user == null) {
			throw apiError(meta.errors.noSuchUser);
		}

		if (await this.roleService.isAdministrator(user) && me.id !== user.id) {
			throw apiError(meta.errors.accessDenied);
		}

		await this.db.transaction(async (transactionalEntityManager) => {
			// パスキーを全て削除
			await transactionalEntityManager.delete(MiUserSecurityKey, { userId: user.id });

			// TOTP・パスワードレスログインを無効化
			await transactionalEntityManager.update(MiUserProfile, { userId: user.id }, {
				twoFactorSecret: null,
				twoFactorBackupSecret: null,
				twoFactorEnabled: false,
				usePasswordLessLogin: false,
			});
		}).then(() => {
			this.moderationLogService.log(me, 'unsetMfa', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});
		});
	}
}
