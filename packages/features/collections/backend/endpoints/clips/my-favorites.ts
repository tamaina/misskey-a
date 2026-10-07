/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedClipsMyFavoritesDefinition, packedClipsMyFavoritesInput, packedClipsMyFavoritesOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { ClipFavoritesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ClipEntityService } from '../../serializers/ClipEntityService.js';

const contractProjection = projectEndpointContract(packedClipsMyFavoritesDefinition);

export const meta = {
	tags: ['account', 'clip'],

	requireCredential: true,

	kind: 'read:clip-favorite',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedClipsMyFavoritesInput, typeof packedClipsMyFavoritesOutput> {
	constructor(
		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,

		private clipEntityService: ClipEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.clipFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.clip', 'clip');

			const favorites = await query
				.getMany();

			return this.clipEntityService.packMany(favorites.map(x => x.clip!), me);
		});
	}
}
