/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidBubbleGameRegisterDefinition, voidBubbleGameRegisterInput, voidBubbleGameRegisterOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';

import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { BubbleGameRecordsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidBubbleGameRegisterDefinition);

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 120,
		minInterval: ms('30sec'),
	},

	errors: {
		invalidSeed: {
			message: 'Provided seed is invalid.',
			code: 'INVALID_SEED',
			id: 'eb627bc7-574b-4a52-a860-3c3eae772b88',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidBubbleGameRegisterInput, typeof voidBubbleGameRegisterOutput> {
	constructor(
		@Inject(DI.bubbleGameRecordsRepository)
		private bubbleGameRecordsRepository: BubbleGameRecordsRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const seedDate = new Date(parseInt(ps.seed, 10));
			const now = new Date();

			// シードが未来なのは通常のプレイではありえないので弾く
			if (seedDate.getTime() > now.getTime()) {
				throw new ApiError(meta.errors.invalidSeed);
			}

			// シードが古すぎる(5時間以上前)のも弾く
			if (seedDate.getTime() < now.getTime() - 1000 * 60 * 60 * 5) {
				throw new ApiError(meta.errors.invalidSeed);
			}

			await this.bubbleGameRecordsRepository.insert({
				id: this.idService.gen(now.getTime()),
				seed: ps.seed,
				seededAt: seedDate,
				userId: me.id,
				score: ps.score,
				logs: ps.logs,
				gameMode: ps.gameMode,
				gameVersion: ps.gameVersion,
				isVerified: false,
			});
		});
	}
}
