/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import * as v from 'valibot';
import type { Config } from '@/config.js';

import { SignupService } from '../../../services/SignupService.js';
import { AdminAccountsCreateContract } from '../../../api.definition.js';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export const meta = {
	tags: ['admin'],

	errors: {
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '1fb7cb09-d46a-4fff-b8df-057708cce513',
		},

		wrongInitialPassword: {
			message: 'Initial password is incorrect.',
			code: 'INCORRECT_INITIAL_PASSWORD',
			id: '97147c55-1ae1-4f6f-91d6-e1c3e0e76d62',
		},
	},
} as const;
export interface AdminAccountsCreateDependencies {
	config: Config;
	serverSettings: MiMeta;
	usersRepository: UsersRepository;
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	signupService: Pick<SignupService, 'signup'>;
	roleService: Pick<RoleService, 'isAdministrator'>;
}
export function createAdminAccountsCreateProcedure(deps: AdminAccountsCreateDependencies) {
	return implement(AdminAccountsCreateContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().use(authentication<MiLocalUser>()).use(apiPolicy<MiLocalUser>({ name: 'admin/accounts/create' })).handler(async ({ input, context }) => {
		const ps = input;
		const _me = context.principal;
		const token = context.token;
		const result = await (async () => {
			const me = _me ? await deps.usersRepository.findOneByOrFail({ id: _me.id }) : null;

			if (deps.serverSettings.rootUserId == null && me == null && token == null) {
				// 初回セットアップの場合
				if (deps.config.setupPassword != null) {
					// 初期パスワードが設定されている場合
					if (ps.setupPassword !== deps.config.setupPassword) {
						// 初期パスワードが違う場合
						throw apiError(meta.errors.wrongInitialPassword);
					}
				} else if (ps.setupPassword != null && ps.setupPassword.trim() !== '') {
					// 初期パスワードが設定されていないのに初期パスワードが入力された場合
					throw apiError(meta.errors.wrongInitialPassword);
				}
			} else if (token !== null || !(await deps.roleService.isAdministrator(me))) {
				// 初回セットアップではなく、管理者でない場合 or 外部トークンを使用している場合
				throw apiError(meta.errors.accessDenied);
			}

			const { account, secret } = await deps.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await deps.userEntityService.packSelf(account, {
				includeSecrets: true,
			});

			return { ...res, token: secret };
		})();
		return v.parse(requiredSchema(AdminAccountsCreateContract['~orpc'].outputSchema), { ...toPackedUserDetailed(result), token: result.token });
	});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
