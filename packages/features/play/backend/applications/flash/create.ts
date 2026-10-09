/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

import { DI } from '@/di-symbols.js';
import { FlashEntityService } from '../../serializers/FlashEntityService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type flashCreateContract } from '../../endpoints/flash/create.contract.js';

@Injectable()
export class FlashCreateApplicationService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private idService: IdService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof flashCreateContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const flash = await this.flashsRepository.insertOne({
			id: this.idService.gen(),
			userId: me.id,
			updatedAt: new Date(),
			title: ps.title,
			summary: ps.summary,
			script: ps.script,
			permissions: ps.permissions,
			visibility: ps.visibility,
		});

		return await this.flashEntityService.pack(flash);
	}
}
