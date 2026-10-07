/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidIRegenerateTokenDefinition, voidIRegenerateTokenInput, voidIRegenerateTokenOutput } from '../../../contract/void-endpoint-definitions.js';
import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';

import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';
import { generateNativeUserToken } from '@/misc/token.js';
import { GlobalEventService } from '../../../../runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidIRegenerateTokenDefinition);

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidIRegenerateTokenInput, typeof voidIRegenerateTokenOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const freshUser = await this.usersRepository.findOneByOrFail({ id: me.id });
			const oldToken = freshUser.token!;

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			const newToken = generateNativeUserToken();

			await this.usersRepository.update(me.id, {
				token: newToken,
			});

			// Publish event
			this.globalEventService.publishInternalEvent('userTokenRegenerated', { id: me.id, oldToken, newToken });
			this.globalEventService.publishMainStream(me.id, 'myTokenRegenerated');
		});
	}
}
