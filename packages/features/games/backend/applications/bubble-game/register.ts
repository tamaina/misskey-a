/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { BubbleGameRecordsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { bubbleGameRegisterInput, bubbleGameRegisterErrors } from '../../endpoints/bubble-game/register.contract.js';

@Injectable()
export class BubbleGameRegisterApplicationService {
	constructor(
		@Inject(DI.bubbleGameRecordsRepository)
		private bubbleGameRecordsRepository: BubbleGameRecordsRepository,

		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<typeof bubbleGameRegisterInput>, me: MiLocalUser) {
		const seedDate = new Date(parseInt(ps.seed, 10));
		const now = new Date();

		// シードが未来なのは通常のプレイではありえないので弾く
		if (seedDate.getTime() > now.getTime()) {
			throw apiError(bubbleGameRegisterErrors.invalidSeed);
		}

		// シードが古すぎる(5時間以上前)のも弾く
		if (seedDate.getTime() < now.getTime() - 1000 * 60 * 60 * 5) {
			throw apiError(bubbleGameRegisterErrors.invalidSeed);
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
	}
}
