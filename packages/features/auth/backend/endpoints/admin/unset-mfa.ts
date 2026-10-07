/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminUnsetMfaDefinition, voidAdminUnsetMfaInput, voidAdminUnsetMfaOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApiError } from '@features/api/backend/transport/error.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../models/UserSecurityKey.js';
import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

const contractProjection = projectEndpointContract(voidAdminUnsetMfaDefinition);

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

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminUnsetMfaInput, typeof voidAdminUnsetMfaOutput> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			if (await this.roleService.isAdministrator(user) && me.id !== user.id) {
				throw new ApiError(meta.errors.accessDenied);
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
		});
	}
}
