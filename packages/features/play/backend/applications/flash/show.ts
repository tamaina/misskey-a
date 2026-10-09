/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { flashShowInput, flashShowErrors } from '../../endpoints/flash/show.contract.js';

@Injectable()
export class FlashShowApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof flashShowInput>, me: MiLocalUser | null) {
		const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });

		if (flash == null) {
			throw apiError(flashShowErrors.noSuchFlash);
		}

		return await this.flashEntityService.pack(flash, me);
	}
}
