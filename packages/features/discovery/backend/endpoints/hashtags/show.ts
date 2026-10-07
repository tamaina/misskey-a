/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedHashtagsShowDefinition, packedHashtagsShowInput, packedHashtagsShowOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { HashtagsRepository } from '@/models/_.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { HashtagEntityService } from '../../serializers/HashtagEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedHashtagsShowDefinition);

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchHashtag: {
			message: 'No such hashtag.',
			code: 'NO_SUCH_HASHTAG',
			id: '110ee688-193e-4a3a-9ecf-c167b2e6981e',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedHashtagsShowInput, typeof packedHashtagsShowOutput> {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private hashtagEntityService: HashtagEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const hashtag = await this.hashtagsRepository.findOneBy({ name: normalizeForSearch(ps.tag) });
			if (hashtag == null) {
				throw new ApiError(meta.errors.noSuchHashtag);
			}

			return await this.hashtagEntityService.pack(hashtag);
		});
	}
}
