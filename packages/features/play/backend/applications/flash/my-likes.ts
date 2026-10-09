/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { FlashLikeEntityService } from '../../serializers/FlashLikeEntityService.js';
import { DI } from '@/di-symbols.js';
import { FlashService } from '../../services/FlashService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { flashMyLikesInput } from '../../endpoints/flash/my-likes.contract.js';

@Injectable()
export class FlashMyLikesApplicationService {
	constructor(
		private flashLikeEntityService: FlashLikeEntityService,
		private flashService: FlashService,
	) {}

	async execute(ps: v.InferOutput<typeof flashMyLikesInput>, me: MiLocalUser) {
		const likes = await this.flashService.myLikes(me.id, {
			sinceId: ps.sinceId,
			untilId: ps.untilId,
			sinceDate: ps.sinceDate,
			untilDate: ps.untilDate,
			limit: ps.limit,
			search: ps.search,
		});

		return this.flashLikeEntityService.packMany(likes, me);
	}
}
