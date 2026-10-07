/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedUsersListsGetMembershipsDefinition, packedUsersListsGetMembershipsInput, packedUsersListsGetMembershipsOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserListsRepository, UserListFavoritesRepository, UserListMembershipsRepository } from '@/models/_.js';

import { UserListEntityService } from '../../../serializers/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedUsersListsGetMembershipsDefinition);

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: false,

	kind: 'read:account',

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable() // eslint-disable-next-line import/no-default-export
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersListsGetMembershipsInput, typeof packedUsersListsGetMembershipsOutput> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userListEntityService: UserListEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			// Fetch the list
			const userList = await this.userListsRepository.findOneBy(!ps.forPublic && me !== null ? {
				id: ps.listId,
				userId: me.id,
			} : {
				id: ps.listId,
				isPublic: true,
			});

			if (userList == null) {
				throw new ApiError(meta.errors.noSuchList);
			}

			const query = this.queryService.makePaginationQuery(this.userListMembershipsRepository.createQueryBuilder('membership'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('membership.userListId = :userListId', { userListId: userList.id })
				.innerJoinAndSelect('membership.user', 'user');

			const memberships = await query
				.limit(ps.limit)
				.getMany();

			return this.userListEntityService.packMembershipsMany(memberships);
		});
	}
}
