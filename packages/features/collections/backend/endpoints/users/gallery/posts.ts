/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
export interface UsersGalleryPostsDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createUsersGalleryPostsProcedure<Actor extends ApiActor>(deps: UsersGalleryPostsDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.usersGalleryPosts).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('post.userId = :userId', { userId: ps.userId });
			const posts = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.galleryPostEntityService.packMany(posts, me)).map(toPackedGalleryPost);
		});
}
