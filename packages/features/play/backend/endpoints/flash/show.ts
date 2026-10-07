/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedFlashShowDefinition, packedFlashShowInput, packedFlashShowOutput } from '../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(packedFlashShowDefinition);

export const meta = {
	tags: ['flashs'],

	requireCredential: false,

	res: contractProjection.response,

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: 'f0d34a1a-d29a-401d-90ba-1982122b5630',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedFlashShowInput, typeof packedFlashShowOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });

			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}

			return await this.flashEntityService.pack(flash, me);
		});
	}
}
