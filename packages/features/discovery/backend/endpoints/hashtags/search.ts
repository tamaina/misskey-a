/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { sqlLikeEscape } from '@features/persistence/backend/utility/sql-like-escape.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { HashtagsRepository } from '@features/persistence/backend/repositories/models.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface HashtagsSearchDependencies {
	hashtagsRepository: HashtagsRepository;
}
export function createHashtagsSearchProcedure<Actor extends MiLocalUser>(deps: HashtagsSearchDependencies) {
	const handler = async ({ input: ps, }: { input: DiscoveryInputs['hashtags/search']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const hashtags = await deps.hashtagsRepository.createQueryBuilder('tag')
			.where('tag.name like :q', { q: sqlLikeEscape(ps.query.toLowerCase()) + '%' })
			.orderBy('tag.mentionedLocalUsersCount', 'DESC')
			.groupBy('tag.id')
			.limit(ps.limit)
			.offset(ps.offset)
			.getMany();

		return hashtags.map(tag => tag.name);
	};
	return createApiProcedure<Actor>()(discoveryContract['hashtags/search']).handler(handler);
}
