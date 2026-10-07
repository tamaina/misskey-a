/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { remainingUsernameAvailableDefinition, remainingUsernameAvailableInput, remainingUsernameAvailableOutput } from '../../../contract/remaining-inline-endpoint-definitions.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, UsedUsernamesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(remainingUsernameAvailableDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof remainingUsernameAvailableInput, typeof remainingUsernameAvailableOutput> {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const exist = await this.usersRepository.countBy({
				host: IsNull(),
				usernameLower: ps.username.toLowerCase(),
			});

			const exist2 = await this.usedUsernamesRepository.countBy({ username: ps.username.toLowerCase() });

			const isPreserved = this.serverSettings.preservedUsernames.map(x => x.toLowerCase()).includes(ps.username.toLowerCase());

			return {
				available: exist === 0 && exist2 === 0 && !isPreserved,
			};
		});
	}
}
