/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedUsersClipsDefinition, packedUsersClipsInput, packedUsersClipsOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { ClipsRepository } from '@/models/_.js';

import { QueryService } from '@/core/QueryService.js';
import { ClipEntityService } from '../../serializers/ClipEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedUsersClipsDefinition);

export const meta = {
	tags: ['users', 'clips'],

	description: 'Show all clips this user owns.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedUsersClipsInput, typeof packedUsersClipsOutput> {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		private clipEntityService: ClipEntityService,
		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('clip.userId = :userId', { userId: ps.userId })
				.andWhere('clip.isPublic = true');

			const clips = await query
				.limit(ps.limit)
				.getMany();

			return await this.clipEntityService.packMany(clips, me);
		});
	}
}
