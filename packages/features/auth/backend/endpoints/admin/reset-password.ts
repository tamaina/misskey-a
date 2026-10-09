/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import bcrypt from 'bcryptjs';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { UsersRepository, UserProfilesRepository, MiMeta } from '@features/persistence/backend/repositories/models.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import * as v from 'valibot';
import { AdminResetPasswordContract } from '../../api.contract.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:reset-password',

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
	return implement(AdminResetPasswordContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'admin/reset-password', requireCredential: true, requireModerator: true, kind: 'write:admin:reset-password' })).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
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
		return v.parse(requiredSchema(AdminResetPasswordContract['~orpc'].outputSchema), result);
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
