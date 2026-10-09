/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
export interface IGalleryLikesDependencies<Actor extends ApiActor> {
	queryService: Pick<CollectionsDependencies<Actor>['queryService'], 'makePaginationQuery'>;
	galleryLikesRepository: Pick<CollectionsDependencies<Actor>['galleryLikesRepository'], 'createQueryBuilder'>;
	galleryLikeEntityService: Pick<CollectionsDependencies<Actor>['galleryLikeEntityService'], 'packMany'>;
}
export function createIGalleryLikesProcedure<Actor extends ApiActor>(deps: IGalleryLikesDependencies<Actor>) {
	return implement(collectionsContract.iGalleryLikes, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.iGalleryLikes['~orpc'].meta.requestName, requireCredential: true, kind: 'read:gallery-likes' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.galleryLikesRepository.createQueryBuilder('like'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('like.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('like.post', 'post');
			const likes = await query
				.limit(ps.limit)
				.getMany();
			return await deps.galleryLikeEntityService.packMany(likes, me);
		});
}
