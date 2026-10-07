/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAnnouncementsDefinition, packedAnnouncementsInput, packedAnnouncementsOutput } from '../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';

import { QueryService } from '@/core/QueryService.js';
import { AnnouncementEntityService } from '../serializers/AnnouncementEntityService.js';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository } from '@/models/_.js';

const contractProjection = projectEndpointContract(packedAnnouncementsDefinition);

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAnnouncementsInput, typeof packedAnnouncementsOutput> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private queryService: QueryService,
		private announcementEntityService: AnnouncementEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('announcement.isActive = :isActive', { isActive: ps.isActive })
				.andWhere(new Brackets(qb => {
					if (me) qb.orWhere('announcement.userId = :meId', { meId: me.id });
					qb.orWhere('announcement.userId IS NULL');
				}));

			const announcements = await query.limit(ps.limit).getMany();

			return this.announcementEntityService.packMany(announcements, me);
		});
	}
}
