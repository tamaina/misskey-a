/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { flashUnlikeInput, flashUnlikeErrors } from '../../endpoints/flash/unlike.contract.js';

@Injectable()
export class FlashUnlikeApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,
	) {}

	async execute(ps: v.InferOutput<typeof flashUnlikeInput>, me: MiLocalUser) {
		const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
		if (flash == null) {
			throw apiError(flashUnlikeErrors.noSuchFlash);
		}

		const exist = await this.flashLikesRepository.findOneBy({
			flashId: flash.id,
			userId: me.id,
		});

		if (exist == null) {
			throw apiError(flashUnlikeErrors.notLiked);
		}

		// Delete like
		await this.flashLikesRepository.delete(exist.id);

		this.flashsRepository.decrement({ id: flash.id }, 'likedCount', 1);
	}
}
