/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { normalizeForSearch } from '../../utility/normalize-for-search.js';
import { HashtagEntityService } from '../../serializers/HashtagEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DiscoveryInputs } from '../discovery.contract.js';

import type { HashtagsRepository } from '@features/persistence/backend/repositories/models.js';

const errors = {
	noSuchHashtag: {
		message: 'No such hashtag.',
		code: 'NO_SUCH_HASHTAG',
		id: '110ee688-193e-4a3a-9ecf-c167b2e6981e',
	},
} as const;

@Injectable()
export class HashtagsShowOperation {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private hashtagEntityService: HashtagEntityService,
	) {
	}

	async execute(ps: DiscoveryInputs['hashtags/show'], _me: MiLocalUser | null) {
		const hashtag = await this.hashtagsRepository.findOneBy({ name: normalizeForSearch(ps.tag) });
		if (hashtag == null) {
			throw apiError(errors.noSuchHashtag);
		}

		return await this.hashtagEntityService.pack(hashtag);
	}
}
