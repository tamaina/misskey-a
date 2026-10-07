/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidIDeleteAccountDefinition, voidIDeleteAccountInput, voidIDeleteAccountOutput } from '../../../contract/void-endpoint-definitions.js';
import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';

import { DeleteAccountService } from '../../services/DeleteAccountService.js';
import { DI } from '@/di-symbols.js';
import { UserAuthService } from '../../../../auth/backend/services/UserAuthService.js';

const contractProjection = projectEndpointContract(voidIDeleteAccountDefinition);

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidIDeleteAccountInput, typeof voidIDeleteAccountOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
		private deleteAccountService: DeleteAccountService,
	) {
		super(meta, contractProjection, async (ps, me) => {
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

			const userDetailed = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (userDetailed.isDeleted) {
				return;
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password!);
			if (!passwordMatched) {
				throw new Error('incorrect password');
			}

			await this.deleteAccountService.deleteAccount(me);
		});
	}
}
