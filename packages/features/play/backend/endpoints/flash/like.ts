/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidFlashLikeDefinition, voidFlashLikeInput, voidFlashLikeOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidFlashLikeDefinition);

export const meta = {
	tags: ['flash'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:flash-likes',

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: 'c07c1491-9161-4c5c-9d75-01906f911f73',
		},

		yourFlash: {
			message: 'You cannot like your flash.',
			code: 'YOUR_FLASH',
			id: '3fd8a0e7-5955-4ba9-85bb-bf3e0c30e13b',
		},

		alreadyLiked: {
			message: 'The flash has already been liked.',
			code: 'ALREADY_LIKED',
			id: '010065cf-ad43-40df-8067-abff9f4686e3',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidFlashLikeInput, typeof voidFlashLikeOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}

			if (flash.userId === me.id) {
				throw new ApiError(meta.errors.yourFlash);
			}

			// if already liked
			const exist = await this.flashLikesRepository.exists({
				where: {
					flashId: flash.id,
					userId: me.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyLiked);
			}

			// Create like
			await this.flashLikesRepository.insert({
				id: this.idService.gen(),
				flashId: flash.id,
				userId: me.id,
			});

			this.flashsRepository.increment({ id: flash.id }, 'likedCount', 1);
		});
	}
}
