/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAntennasCreateDefinition, packedAntennasCreateInput, packedAntennasCreateOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { IdService } from '../../../../runtime/backend/services/IdService.js';
import type { UserListsRepository, AntennasRepository } from '@/models/_.js';
import { GlobalEventService } from '../../../../runtime/backend/services/GlobalEventService.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '../../../../roles/backend/services/RoleService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(packedAntennasCreateDefinition);

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
		},

		tooManyAntennas: {
			message: 'You cannot create antenna any more.',
			code: 'TOO_MANY_ANTENNAS',
			id: 'faf47050-e8b5-438c-913c-db2b1576fde4',
		},

		emptyKeyword: {
			message: 'Either keywords or excludeKeywords is required.',
			code: 'EMPTY_KEYWORD',
			id: '53ee222e-1ddd-4f9a-92e5-9fb82ddb463a',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAntennasCreateInput, typeof packedAntennasCreateOutput> {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private antennaEntityService: AntennaEntityService,
		private roleService: RoleService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
				throw new ApiError(meta.errors.emptyKeyword);
			}

			const currentAntennasCount = await this.antennasRepository.countBy({
				userId: me.id,
			});
			if (currentAntennasCount >= (await this.roleService.getUserPolicies(me.id)).antennaLimit) {
				throw new ApiError(meta.errors.tooManyAntennas);
			}

			let userList;

			if (ps.src === 'list' && ps.userListId) {
				userList = await this.userListsRepository.findOneBy({
					id: ps.userListId,
					userId: me.id,
				});

				if (userList == null) {
					throw new ApiError(meta.errors.noSuchUserList);
				}
			}

			const now = new Date();

			const antenna = await this.antennasRepository.insertOne({
				id: this.idService.gen(now.getTime()),
				lastUsedAt: now,
				userId: me.id,
				name: ps.name,
				src: ps.src,
				userListId: userList ? userList.id : null,
				keywords: ps.keywords,
				excludeKeywords: ps.excludeKeywords,
				users: ps.users,
				caseSensitive: ps.caseSensitive,
				localOnly: ps.localOnly,
				excludeBots: ps.excludeBots,
				withReplies: ps.withReplies,
				withFile: ps.withFile,
				excludeNotesInSensitiveChannel: ps.excludeNotesInSensitiveChannel,
			});

			this.globalEventService.publishInternalEvent('antennaCreated', antenna);

			return await this.antennaEntityService.pack(antenna);
		});
	}
}
