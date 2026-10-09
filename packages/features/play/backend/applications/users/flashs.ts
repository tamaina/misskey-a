/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { usersFlashsInput } from '../../endpoints/users/flashs.contract.js';

@Injectable()
export class UsersFlashsApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: v.InferOutput<typeof usersFlashsInput>, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('flash.userId = :userId', { userId: ps.userId })
			.andWhere('flash.visibility = \'public\'');

		const flashs = await query
			.limit(ps.limit)
			.getMany();

		return await this.flashEntityService.packMany(flashs);
	}
}
