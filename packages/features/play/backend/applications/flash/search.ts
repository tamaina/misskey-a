/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { flashSearchInput } from '../../endpoints/flash/search.contract.js';

@Injectable()
export class FlashSearchApplicationService {
	constructor(
		private flashService: FlashService,
		private flashEntityService: FlashEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof flashSearchInput>, me: MiLocalUser | null) {
		const result = await this.flashService.search(ps.query, {
			sinceId: ps.sinceId,
			untilId: ps.untilId,
			sinceDate: ps.sinceDate,
			untilDate: ps.untilDate,
			limit: ps.limit,
		});

		return await this.flashEntityService.packMany(result, me);
	}
}
