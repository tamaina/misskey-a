/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedHashtag } from '../hashtag.schema.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { normalizeForSearch } from '../../utility/normalize-for-search.js';
import { HashtagEntityService } from '../../serializers/HashtagEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { HashtagsRepository } from '@features/persistence/backend/repositories/models.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
const errors = {
	noSuchHashtag: {
		message: 'No such hashtag.',
		code: 'NO_SUCH_HASHTAG',
		id: '110ee688-193e-4a3a-9ecf-c167b2e6981e',
	},
} as const;
export interface HashtagsShowDependencies {
	hashtagsRepository: HashtagsRepository;
	hashtagEntityService: HashtagEntityService;
}
export function createHashtagsShowProcedure<Actor extends MiLocalUser>(deps: HashtagsShowDependencies) {
	const handler = async ({ input: ps, }: { input: DiscoveryInputs['hashtags/show']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const hashtag = await deps.hashtagsRepository.findOneBy({ name: normalizeForSearch(ps.tag) });
		if (hashtag == null) {
			throw apiError(errors.noSuchHashtag);
		}

		return toPackedHashtag(await deps.hashtagEntityService.pack(hashtag));
	};
	return createApiProcedure<Actor>()(discoveryContract['hashtags/show']).handler(handler);
}
