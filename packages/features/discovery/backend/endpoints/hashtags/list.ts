/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedHashtagsListDefinition, packedHashtagsListInput, packedHashtagsListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { HashtagsRepository } from '@/models/_.js';
import { HashtagEntityService } from '../../serializers/HashtagEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedHashtagsListDefinition);

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedHashtagsListInput, typeof packedHashtagsListOutput> {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private hashtagEntityService: HashtagEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.hashtagsRepository.createQueryBuilder('tag');

			if (ps.attachedToUserOnly) query.andWhere('tag.attachedUsersCount != 0');
			if (ps.attachedToLocalUserOnly) query.andWhere('tag.attachedLocalUsersCount != 0');
			if (ps.attachedToRemoteUserOnly) query.andWhere('tag.attachedRemoteUsersCount != 0');

			switch (ps.sort) {
				case '+mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'DESC'); break;
				case '-mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'ASC'); break;
				case '+mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'DESC'); break;
				case '-mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'ASC'); break;
				case '+mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'DESC'); break;
				case '-mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'ASC'); break;
				case '+attachedUsers': query.orderBy('tag.attachedUsersCount', 'DESC'); break;
				case '-attachedUsers': query.orderBy('tag.attachedUsersCount', 'ASC'); break;
				case '+attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'DESC'); break;
				case '-attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'ASC'); break;
				case '+attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'DESC'); break;
				case '-attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'ASC'); break;
			}

			query.select([
				'tag.name',
				'tag.mentionedUsersCount',
				'tag.mentionedLocalUsersCount',
				'tag.mentionedRemoteUsersCount',
				'tag.attachedUsersCount',
				'tag.attachedLocalUsersCount',
				'tag.attachedRemoteUsersCount',
			]);

			const tags = await query.limit(ps.limit).getMany();

			return this.hashtagEntityService.packMany(tags);
		});
	}
}
