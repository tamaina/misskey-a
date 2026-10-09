/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type flashLikeContract, flashLikeErrors } from '../../endpoints/flash/like.contract.js';

@Injectable()
export class FlashLikeApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private idService: IdService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof flashLikeContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
		if (flash == null) {
			throw apiError(flashLikeErrors.noSuchFlash);
		}

		if (flash.userId === me.id) {
			throw apiError(flashLikeErrors.yourFlash);
		}

		// if already liked
		const exist = await this.flashLikesRepository.exists({
			where: {
				flashId: flash.id,
				userId: me.id,
			},
		});

		if (exist) {
			throw apiError(flashLikeErrors.alreadyLiked);
		}

		// Create like
		await this.flashLikesRepository.insert({
			id: this.idService.gen(),
			flashId: flash.id,
			userId: me.id,
		});

		this.flashsRepository.increment({ id: flash.id }, 'likedCount', 1);
	}
}
