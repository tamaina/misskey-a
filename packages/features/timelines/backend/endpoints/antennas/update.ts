/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAntennasUpdateDefinition, packedAntennasUpdateInput, packedAntennasUpdateOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AntennasRepository, UserListsRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { AntennaEntityService } from '../../serializers/AntennaEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedAntennasUpdateDefinition);

export const meta = {
	tags: ['antennas'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchAntenna: {
			message: 'No such antenna.',
			code: 'NO_SUCH_ANTENNA',
			id: '10c673ac-8852-48eb-aa1f-f5b67f069290',
		},

		noSuchUserList: {
			message: 'No such user list.',
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7',
		},

		emptyKeyword: {
			message: 'Either keywords or excludeKeywords is required.',
			code: 'EMPTY_KEYWORD',
			id: '721aaff6-4e1b-4d88-8de6-877fae9f68c4',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAntennasUpdateInput, typeof packedAntennasUpdateOutput> {
	constructor(
		@Inject(DI.antennasRepository)
		private antennasRepository: AntennasRepository,

		@Inject(DI.userListsRepository)
		private userListsRepository: UserListsRepository,

		private antennaEntityService: AntennaEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.keywords && ps.excludeKeywords) {
				if (ps.keywords.flat().every(x => x === '') && ps.excludeKeywords.flat().every(x => x === '')) {
					throw new ApiError(meta.errors.emptyKeyword);
				}
			}
			// Fetch the antenna
			const antenna = await this.antennasRepository.findOneBy({
				id: ps.antennaId,
				userId: me.id,
			});

			if (antenna == null) {
				throw new ApiError(meta.errors.noSuchAntenna);
			}

			let userList;

			if ((ps.src === 'list' || antenna.src === 'list') && ps.userListId) {
				userList = await this.userListsRepository.findOneBy({
					id: ps.userListId,
					userId: me.id,
				});

				if (userList == null) {
					throw new ApiError(meta.errors.noSuchUserList);
				}
			}

			await this.antennasRepository.update(antenna.id, {
				name: ps.name,
				src: ps.src,
				userListId: ps.userListId !== undefined ? userList ? userList.id : null : undefined,
				keywords: ps.keywords,
				excludeKeywords: ps.excludeKeywords,
				users: ps.users,
				caseSensitive: ps.caseSensitive,
				localOnly: ps.localOnly,
				excludeBots: ps.excludeBots,
				withReplies: ps.withReplies,
				withFile: ps.withFile,
				excludeNotesInSensitiveChannel: ps.excludeNotesInSensitiveChannel,
				isActive: true,
				lastUsedAt: new Date(),
			});

			this.globalEventService.publishInternalEvent('antennaUpdated', await this.antennasRepository.findOneByOrFail({ id: antenna.id }));

			return await this.antennaEntityService.pack(antenna.id);
		});
	}
}
