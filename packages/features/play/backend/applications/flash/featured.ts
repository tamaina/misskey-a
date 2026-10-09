/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type flashFeaturedContract } from '../../endpoints/flash/featured.contract.js';

@Injectable()
export class FlashFeaturedApplicationService {
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof flashFeaturedContract)['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const result = await this.flashService.featured({
			offset: ps.offset,
			limit: ps.limit,
		});
		return await this.flashEntityService.packMany(result, me);
	}
}
