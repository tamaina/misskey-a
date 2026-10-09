/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { FlashEntityService } from '../../serializers/FlashEntityService.js';
import { DI } from '@/di-symbols.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type flashMyContract } from '../../endpoints/flash/my.contract.js';

@Injectable()
export class FlashMyApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private queryService: QueryService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof flashMyContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const query = this.queryService.makePaginationQuery(this.flashsRepository.createQueryBuilder('flash'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
			.andWhere('flash.userId = :meId', { meId: me.id });

		const flashs = await query
			.limit(ps.limit)
			.getMany();

		return await this.flashEntityService.packMany(flashs);
	}
}
