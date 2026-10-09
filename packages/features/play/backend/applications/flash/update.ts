/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type flashUpdateContract, flashUpdateErrors } from '../../endpoints/flash/update.contract.js';

@Injectable()
export class FlashUpdateApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof flashUpdateContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
		if (flash == null) {
			throw apiError(flashUpdateErrors.noSuchFlash);
		}
		if (flash.userId !== me.id) {
			throw apiError(flashUpdateErrors.accessDenied);
		}

		await this.flashsRepository.update(flash.id, {
			updatedAt: new Date(),
			...Object.fromEntries(
				Object.entries(ps).filter(
					([key, val]) => key !== 'flashId',
				),
			),
		});
	}
}
