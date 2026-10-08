/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { NativeContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedPinnedUsersDefinition, packedPinnedUsersInput, packedPinnedUsersOutput } from '../../contract/packed-endpoint-definitions.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import * as Acct from '@features/federation/backend/utility/acct.js';
import type { MiUser } from '@features/users/backend/models/User.js';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';

import * as v from 'valibot';
import { nativeUserDetailedSchema } from '@features/users/backend/serializers/native-user.js';

export const nativeOutputSchema = v.array(nativeUserDetailedSchema);

const contractProjection = projectEndpointContract(packedPinnedUsersDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends NativeContractEndpoint<typeof meta, typeof packedPinnedUsersInput, typeof packedPinnedUsersOutput, typeof nativeOutputSchema> {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, nativeOutputSchema, async (ps, me) => {
			const users = await Promise.all(this.serverSettings.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => this.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));

			return await this.userEntityService.packMany(users.filter(x => x != null), me, { schema: 'UserDetailed' });
		});
	}
}
