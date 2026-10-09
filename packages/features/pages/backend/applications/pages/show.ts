/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { PackedJsonValue } from '@features/users/backend/json-value.schema.js';
import type { MiPage } from '../../models/Page.js';
import { PageEntityService } from '../../serializers/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesShowInput, pagesShowErrors } from '../../endpoints/pages/show.contract.js';

/** Legacy competing selectors pass their original JSON pageId directly to TypeORM. */
export interface PagesSelectorRepository {
	findOneBy(selector: { id: PackedJsonValue | undefined } | { name: string; userId: string }): Promise<MiPage | null>;
}

@Injectable()
export class PagesShowApplicationService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesSelectorRepository,

		private pageEntityService: PageEntityService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesShowInput>, me: MiLocalUser | null) {
		let page: MiPage | null = null;

		if ('pageId' in ps) {
			page = await this.pagesRepository.findOneBy({ id: ps.pageId });
		} else {
			const author = await this.usersRepository.findOneBy({
				host: IsNull(),
				usernameLower: ps.username.toLowerCase(),
			});
			if (author) {
				page = await this.pagesRepository.findOneBy({
					name: ps.name,
					userId: author.id,
				});
			}
		}

		if (page == null) {
			throw apiError(pagesShowErrors.noSuchPage);
		}

		return await this.pageEntityService.pack(page, me);
	}
}
