/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAdminAdListDefinition, packedAdminAdListInput, packedAdminAdListOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AdsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedAdminAdListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:ad',
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAdListInput, typeof packedAdminAdListOutput> {
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private queryService: QueryService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.adsRepository.createQueryBuilder('ad'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);
			if (ps.publishing === true) {
				query.andWhere('ad.expiresAt > :now', { now: new Date() }).andWhere('ad.startsAt <= :now', { now: new Date() });
			} else if (ps.publishing === false) {
				query.andWhere('ad.expiresAt <= :now', { now: new Date() }).orWhere('ad.startsAt > :now', { now: new Date() });
			}
			const ads = await query.limit(ps.limit).getMany();

			return ads.map(ad => ({
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				memo: ad.memo,
				place: ad.place,
				priority: ad.priority,
				ratio: ad.ratio,
			}));
		});
	}
}
