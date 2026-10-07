/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedUsersListsCreateDefinition, packedUsersListsCreateInput, packedUsersListsCreateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { UserListsRepository } from '@/models/_.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiUserList } from '../../../models/UserList.js';

import { UserListEntityService } from '../../../serializers/UserListEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';

const contractProjection = projectEndpointContract(packedUsersListsCreateDefinition);

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	description: 'Create a new list of users.',

	res: contractProjection.response,

	errors: {
		tooManyUserLists: {
			message: 'You cannot create user list any more.',
			code: 'TOO_MANY_USERLISTS',
			id: '0cf21a28-7715-4f39-a20d-777bfdb8d138',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersListsCreateInput, typeof packedUsersListsCreateOutput> {
	constructor(
		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private userListEntityService: UserListEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const currentCount = await this.userListsRepository.countBy({
				userId: me.id,
			});
			if (currentCount >= (await this.roleService.getUserPolicies(me.id)).userListLimit) {
				throw new ApiError(meta.errors.tooManyUserLists);
			}

			const userList = await this.userListsRepository.insertOne({
				id: this.idService.gen(),
				userId: me.id,
				name: ps.name,
			} as MiUserList);

			return await this.userListEntityService.pack(userList);
		});
	}
}
