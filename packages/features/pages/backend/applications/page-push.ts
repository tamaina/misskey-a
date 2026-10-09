/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository } from '@features/persistence/backend/repositories/models.js';

import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { InferSchemaOutput } from '@orpc/contract';
import { type pagePushContract, pagePushErrors } from '../endpoints/page-push.contract.js';

@Injectable()
export class PagePushApplicationService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {}

	async execute(ps: InferSchemaOutput<NonNullable<(typeof pagePushContract)['~orpc']['inputSchema']>>, me: MiLocalUser) {
		const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
		if (page == null) {
			throw apiError(pagePushErrors.noSuchPage);
		}

		this.globalEventService.publishMainStream(page.userId, 'pageEvent', {
			pageId: ps.pageId,
			event: ps.event,
			var: ps.var,
			userId: me.id,
			user: await this.userEntityService.pack(me.id, { id: page.userId }, {
				schema: 'UserDetailed',
			}),
		});
	}
}
