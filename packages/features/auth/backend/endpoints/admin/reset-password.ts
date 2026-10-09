/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import bcrypt from 'bcryptjs';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { UsersRepository, UserProfilesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

import { AdminResetPasswordContract } from '../../api.definition.js';
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
export interface AdminResetPasswordDependencies {
	serverSettings: MiMeta;
	usersRepository: UsersRepository;
	userProfilesRepository: UserProfilesRepository;
	roleService: Pick<RoleService, 'isAdministrator'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}
export function createAdminResetPasswordProcedure(deps: AdminResetPasswordDependencies) {
	return createApiProcedure<MiLocalUser>()(AdminResetPasswordContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
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

			const passwd = secureRndstr(8);

			// Generate hash of password
			const hash = bcrypt.hashSync(passwd);

			await deps.userProfilesRepository.update({
				userId: user.id,
			}, {
				password: hash,
			});

			deps.moderationLogService.log(me, 'resetPassword', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});

			return {
				password: passwd,
			};
		})();
		return result;
	});
}
