/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { DataSource } from 'typeorm';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { MiUserSecurityKey } from '../../models/UserSecurityKey.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

import { AdminUnsetMfaContract } from '../../api.definition.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export const meta = {
	tags: ['admin'],

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
export interface AdminUnsetMfaDependencies {
	db: DataSource;
	usersRepository: UsersRepository;
	roleService: Pick<RoleService, 'isAdministrator'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminUnsetMfaProcedure(deps: AdminUnsetMfaDependencies) {
	return createApiProcedure<MiLocalUser>()(AdminUnsetMfaContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const ps = input;
		const me = context.principal;
		const result = await (async () => {
			const user = await deps.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw apiError(meta.errors.noSuchUser);
			}

			if (await deps.roleService.isAdministrator(user) && me.id !== user.id) {
				throw apiError(meta.errors.accessDenied);
			}

			await deps.db.transaction(async (transactionalEntityManager) => {
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
				deps.moderationLogService.log(me, 'unsetMfa', {
					userId: user.id,
					userUsername: user.username,
					userHost: user.host,
				});
			});
		})();
		return result;
	});
}
