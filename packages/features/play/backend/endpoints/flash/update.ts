/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidFlashUpdateDefinition, voidFlashUpdateInput, voidFlashUpdateOutput } from '../../../contract/void-endpoint-definitions.js';
import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(voidFlashUpdateDefinition);

export const meta = {
	tags: ['flash'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:flash',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: '611e13d2-309e-419a-a5e4-e0422da39b02',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '08e60c88-5948-478e-a132-02ec701d67b2',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidFlashUpdateInput, typeof voidFlashUpdateOutput> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}
			if (flash.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.flashsRepository.update(flash.id, {
				updatedAt: new Date(),
				...Object.fromEntries(
					Object.entries(ps).filter(
						([key, val]) => (key !== 'flashId') && Object.hasOwn(voidFlashUpdateInput.entries, key),
					),
				),
			});
		});
	}
}
