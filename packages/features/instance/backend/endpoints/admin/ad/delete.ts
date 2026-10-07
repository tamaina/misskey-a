/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminAdDeleteDefinition, voidAdminAdDeleteInput, voidAdminAdDeleteOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { AdsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(voidAdminAdDeleteDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:ad',

	errors: {
		noSuchAd: {
			message: 'No such ad.',
			code: 'NO_SUCH_AD',
			id: 'ccac9863-3a03-416e-b899-8a64041118b1',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminAdDeleteInput, typeof voidAdminAdDeleteOutput> {
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const ad = await this.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw new ApiError(meta.errors.noSuchAd);

			await this.adsRepository.delete(ad.id);

			this.moderationLogService.log(me, 'deleteAd', {
				adId: ad.id,
				ad: ad,
			});
		});
	}
}
