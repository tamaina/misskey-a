/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { compositionAdminAccountsCreateDefinition, compositionAdminAccountsCreateInput, compositionAdminAccountsCreateOutput } from '../../../../contract/output-composition-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { SignupService } from '../../../services/SignupService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { ApiError } from '@features/api/backend/transport/error.js';
import * as v from 'valibot';
import { nativeMeDetailedSchema } from '@features/users/backend/serializers/native-user.js';

const nativeOutputSchema = v.strictObject({ ...nativeMeDetailedSchema.entries, token: v.string() });

const contractProjection = projectEndpointContract(compositionAdminAccountsCreateDefinition);

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

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof compositionAdminAccountsCreateInput, typeof compositionAdminAccountsCreateOutput, typeof nativeOutputSchema> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private signupService: SignupService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, _me, token) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;

			if (this.serverSettings.rootUserId == null && me == null && token == null) {
				// 初回セットアップの場合
				if (this.config.setupPassword != null) {
					// 初期パスワードが設定されている場合
					if (ps.setupPassword !== this.config.setupPassword) {
						// 初期パスワードが違う場合
						throw new ApiError(meta.errors.wrongInitialPassword);
					}
				} else if (ps.setupPassword != null && ps.setupPassword.trim() !== '') {
					// 初期パスワードが設定されていないのに初期パスワードが入力された場合
					throw new ApiError(meta.errors.wrongInitialPassword);
				}
			} else if (token !== null || !(await this.roleService.isAdministrator(me))) {
				// 初回セットアップではなく、管理者でない場合 or 外部トークンを使用している場合
				throw new ApiError(meta.errors.accessDenied);
			}

			const { account, secret } = await this.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await this.userEntityService.packSelf(account, {
				includeSecrets: true,
			});

			return { ...res, token: secret };
		});
	}
}
