/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedHashtag } from '../hashtag.schema.js';
import { HashtagEntityService } from '../../serializers/HashtagEntityService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { HashtagsRepository } from '@features/persistence/backend/repositories/models.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiContext } from '@features/api/backend/transport/context.js';
import { discoveryContract, type DiscoveryInputs } from '../discovery.contract.js';
export interface HashtagsListDependencies {
	hashtagsRepository: HashtagsRepository;
	hashtagEntityService: HashtagEntityService;
}
export function createHashtagsListProcedure<Actor extends MiLocalUser>(deps: HashtagsListDependencies) {
	const handler = async ({ input: ps, }: { input: DiscoveryInputs['hashtags/list']; context: ApiContext<Actor> & { principal: Actor | null } }) => {
		const query = deps.hashtagsRepository.createQueryBuilder('tag');

		if (ps.attachedToUserOnly) query.andWhere('tag.attachedUsersCount != 0');
		if (ps.attachedToLocalUserOnly) query.andWhere('tag.attachedLocalUsersCount != 0');
		if (ps.attachedToRemoteUserOnly) query.andWhere('tag.attachedRemoteUsersCount != 0');

		switch (ps.sort) {
			case '+mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'DESC'); break;
			case '-mentionedUsers': query.orderBy('tag.mentionedUsersCount', 'ASC'); break;
			case '+mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'DESC'); break;
			case '-mentionedLocalUsers': query.orderBy('tag.mentionedLocalUsersCount', 'ASC'); break;
			case '+mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'DESC'); break;
			case '-mentionedRemoteUsers': query.orderBy('tag.mentionedRemoteUsersCount', 'ASC'); break;
			case '+attachedUsers': query.orderBy('tag.attachedUsersCount', 'DESC'); break;
			case '-attachedUsers': query.orderBy('tag.attachedUsersCount', 'ASC'); break;
			case '+attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'DESC'); break;
			case '-attachedLocalUsers': query.orderBy('tag.attachedLocalUsersCount', 'ASC'); break;
			case '+attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'DESC'); break;
			case '-attachedRemoteUsers': query.orderBy('tag.attachedRemoteUsersCount', 'ASC'); break;
		}

		query.select([
			'tag.name',
			'tag.mentionedUsersCount',
			'tag.mentionedLocalUsersCount',
			'tag.mentionedRemoteUsersCount',
			'tag.attachedUsersCount',
			'tag.attachedLocalUsersCount',
			'tag.attachedRemoteUsersCount',
		]);

		const tags = await query.limit(ps.limit).getMany();

		return (await deps.hashtagEntityService.packMany(tags)).map(toPackedHashtag);
	};
	return createApiProcedure<Actor>()(discoveryContract['hashtags/list']).handler(handler);
}
