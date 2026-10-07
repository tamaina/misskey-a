/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidIChangePasswordDefinition, voidIChangePasswordInput, voidIChangePasswordOutput } from '../../../contract/void-endpoint-definitions.js';
import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import type { UserProfilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { UserAuthService } from '../../services/UserAuthService.js';

const contractProjection = projectEndpointContract(voidIChangePasswordDefinition);

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidIChangePasswordInput, typeof voidIChangePasswordOutput> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
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

			const passwordMatched = await bcrypt.compare(ps.currentPassword, profile.password!);

			if (!passwordMatched) {
				throw new Error('incorrect password');
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(ps.newPassword, salt);

			await this.userProfilesRepository.update(me.id, {
				password: hash,
			});
		});
	}
}
