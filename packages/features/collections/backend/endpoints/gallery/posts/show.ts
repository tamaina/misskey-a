/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { collectionsContract } from '../../../api.contract.js';
import type { CollectionsDependencies } from '../../../api.dependencies.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface GalleryPostsShowDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'findOneBy'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'pack'>;
}
export function createGalleryPostsShowProcedure<Actor extends ApiActor>(deps: GalleryPostsShowDependencies<Actor>) {
	return implement(collectionsContract.galleryPostsShow, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.galleryPostsShow['~orpc'].meta.requestName }))
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const post = await deps.galleryPostsRepository.findOneBy({
				id: ps.postId,
			});
			if (post == null) {
				throw apiError(collectionsErrors.galleryPostsShow.noSuchPost);
			}
			return await deps.galleryPostEntityService.pack(post, me);
		});
}
