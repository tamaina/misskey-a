/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { compositionUsersListsShowDefinition, compositionUsersListsShowInput, compositionUsersListsShowOutput } from '../../../../contract/output-composition-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserListsRepository, UserListFavoritesRepository } from '@/models/_.js';
import { UserListEntityService } from '../../../serializers/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(compositionUsersListsShowDefinition);

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: false,

	kind: 'read:account',

	description: 'Show the properties of a list.',

	res: contractProjection.response,

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '7bc05c21-1d7a-41ae-88f1-66820f4dc686',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable() // eslint-disable-next-line import/no-default-export
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof compositionUsersListsShowInput, typeof compositionUsersListsShowOutput> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		@Inject(DI.userListFavoritesRepository)
		private userListFavoritesRepository: UserListFavoritesRepository,

		private userListEntityService: UserListEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const additionalProperties: Partial<{ likedCount: number, isLiked: boolean }> = {};
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

			if (ps.forPublic && userList.isPublic) {
				additionalProperties.likedCount = await this.userListFavoritesRepository.countBy({
					userListId: ps.listId,
				});
				if (me !== null) {
					additionalProperties.isLiked = await this.userListFavoritesRepository.exists({
						where: {
							userId: me.id,
							userListId: ps.listId,
						},
					});
				} else {
					additionalProperties.isLiked = false;
				}
			}
			return {
				...await this.userListEntityService.pack(userList),
				...additionalProperties,
			};
		});
	}
}
