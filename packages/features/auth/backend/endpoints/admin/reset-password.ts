/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAdminResetPasswordDefinition, inlineAdminResetPasswordInput, inlineAdminResetPasswordOutput } from '../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

import { ApiError } from '@features/api/backend/transport/error.js';
import type { UsersRepository, UserProfilesRepository, MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '../../utility/secure-rndstr.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

const contractProjection = projectEndpointContract(inlineAdminResetPasswordDefinition);

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

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminResetPasswordInput, typeof inlineAdminResetPasswordOutput> {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

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

			const passwd = secureRndstr(8);

			// Generate hash of password
			const hash = bcrypt.hashSync(passwd);

			await this.userProfilesRepository.update({
				userId: user.id,
			}, {
				password: hash,
			});

			this.moderationLogService.log(me, 'resetPassword', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});

			return {
				password: passwd,
			};
		});
	}
}
