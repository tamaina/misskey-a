/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { packedAdminAdCreateDefinition, packedAdminAdCreateInput, packedAdminAdCreateOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AdsRepository } from '@/models/_.js';
import { IdService } from '../../../../../runtime/backend/services/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';

const contractProjection = projectEndpointContract(packedAdminAdCreateDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',
	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedAdminAdCreateInput, typeof packedAdminAdCreateOutput> {
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const ad = await this.adsRepository.insertOne({
				id: this.idService.gen(),
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
				dayOfWeek: ps.dayOfWeek,
				isSensitive: ps.isSensitive,
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});

			this.moderationLogService.log(me, 'createAd', {
				adId: ad.id,
				ad: ad,
			});

			return {
				id: ad.id,
				expiresAt: ad.expiresAt.toISOString(),
				startsAt: ad.startsAt.toISOString(),
				dayOfWeek: ad.dayOfWeek,
				isSensitive: ad.isSensitive,
				url: ad.url,
				imageUrl: ad.imageUrl,
				priority: ad.priority,
				ratio: ad.ratio,
				place: ad.place,
				memo: ad.memo,
			};
		});
	}
}
