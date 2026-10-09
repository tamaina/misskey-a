/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../../api.contract.js';
import type { CollectionsDependencies } from '../../../api.dependencies.js';
export interface IGalleryPostsDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'createQueryBuilder'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'packMany'>;
}
export function createIGalleryPostsProcedure<Actor extends ApiActor>(deps: IGalleryPostsDependencies<Actor>) {
	return implement(collectionsContract.iGalleryPosts, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.iGalleryPosts['~orpc'].meta.requestName, requireCredential: true, kind: 'read:gallery' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('post.userId = :meId', { meId: me.id });
			const posts = await query
				.limit(ps.limit)
				.getMany();
			return await deps.galleryPostEntityService.packMany(posts, me);
		});
}
