/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedHashtagsUsersDefinition, packedHashtagsUsersInput, packedHashtagsUsersOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { UsersRepository } from '@/models/_.js';
import { safeForSql } from "@/misc/safe-for-sql.js";
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedHashtagsUsersDefinition);

export const meta = {
	requireCredential: false,

	tags: ['hashtags', 'users'],

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedHashtagsUsersInput, typeof packedHashtagsUsersOutput> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (!safeForSql(normalizeForSearch(ps.tag))) throw new Error('Injection');
			const query = this.usersRepository.createQueryBuilder('user')
				.where(':tag <@ user.tags', { tag: [normalizeForSearch(ps.tag)] })
				.andWhere('user.isSuspended = FALSE');

			const recent = new Date(Date.now() - (1000 * 60 * 60 * 24 * 5));

			if (ps.state === 'alive') {
				query.andWhere('user.updatedAt > :date', { date: recent });
			}

			if (ps.origin === 'local') {
				query.andWhere('user.host IS NULL');
			} else if (ps.origin === 'remote') {
				query.andWhere('user.host IS NOT NULL');
			}

			switch (ps.sort) {
				case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
				case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
				case '+createdAt': query.orderBy('user.id', 'DESC'); break;
				case '-createdAt': query.orderBy('user.id', 'ASC'); break;
				case '+updatedAt': query.orderBy('user.updatedAt', 'DESC'); break;
				case '-updatedAt': query.orderBy('user.updatedAt', 'ASC'); break;
			}

			const users = await query
				.limit(ps.limit)
				.offset(ps.offset)
				.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
	}
}
