/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedClipsListDefinition, packedClipsListInput, packedClipsListOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { ClipsRepository } from '@features/persistence/backend/repositories/models.js';
import { ClipEntityService } from '../../serializers/ClipEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedClipsListDefinition);

export const meta = {
	tags: ['clips', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedClipsListInput, typeof packedClipsListOutput> {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		private queryService: QueryService,
		private clipEntityService: ClipEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.clipsRepository.createQueryBuilder('clip'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('clip.userId = :userId', { userId: me.id });

			const clips = await query.limit(ps.limit).getMany();

			return await this.clipEntityService.packMany(clips, me);
		});
	}
}
