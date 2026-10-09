/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DiscoveryInputs } from '../discovery.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { HashtagsRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';

@Injectable()
export class HashtagsSearchOperation {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,
	) {
	}

	async execute(ps: DiscoveryInputs['hashtags/search'], _me: MiLocalUser | null) {
		const hashtags = await this.hashtagsRepository.createQueryBuilder('tag')
			.where('tag.name like :q', { q: sqlLikeEscape(ps.query.toLowerCase()) + '%' })
			.orderBy('tag.mentionedLocalUsersCount', 'DESC')
			.groupBy('tag.id')
			.limit(ps.limit)
			.offset(ps.offset)
			.getMany();

		return hashtags.map(tag => tag.name);
	}
}
