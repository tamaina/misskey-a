/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
export interface IGalleryPostsDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createIGalleryPostsProcedure<Actor extends ApiActor>(deps: IGalleryPostsDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.iGalleryPosts).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('post.userId = :meId', { meId: me.id });
			const posts = await query
				.limit(ps.limit)
				.getMany();
			return (await deps.galleryPostEntityService.packMany(posts, me)).map(toPackedGalleryPost);
		});
}
