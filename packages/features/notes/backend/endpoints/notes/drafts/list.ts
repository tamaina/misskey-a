/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedNotesDraftsListDefinition, packedNotesDraftsListInput, packedNotesDraftsListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { MiNoteDraft, NoteDraftsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';

const contractProjection = projectEndpointContract(packedNotesDraftsListDefinition);

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'read:account',

	res: contractProjection.response,

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedNotesDraftsListInput, typeof packedNotesDraftsListOutput> {
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private queryService: QueryService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery<MiNoteDraft>(this.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('drafts.userId = :meId', { meId: me.id });

			if (ps.scheduled === true) {
				query.andWhere('drafts.isActuallyScheduled = true');
			} else if (ps.scheduled === false) {
				query.andWhere('drafts.isActuallyScheduled = false');
			}

			const drafts = await query
				.limit(ps.limit)
				.getMany();

			return await this.noteDraftEntityService.packMany(drafts, me);
		});
	}
}
