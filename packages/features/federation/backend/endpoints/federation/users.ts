/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFederationUsersDefinition, packedFederationUsersInput, packedFederationUsersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { UsersRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedFederationUsersDefinition);

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFederationUsersInput, typeof packedFederationUsersOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.usersRepository.createQueryBuilder('user'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('user.host = :host', { host: ps.host });

			const users = await query
				.limit(ps.limit)
				.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailedNotMe' });
		});
	}
}
