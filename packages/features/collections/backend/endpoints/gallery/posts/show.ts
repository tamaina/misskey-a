/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedGalleryPost } from '../../../api.dto.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface GalleryPostsShowDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'findOneBy'>;
	galleryPostEntityService: Pick<CollectionsDependencies<Actor>['galleryPostEntityService'], 'pack'>;
}
export function createGalleryPostsShowProcedure<Actor extends ApiActor>(deps: GalleryPostsShowDependencies<Actor>) {
	return createApiProcedure<Actor>()(collectionsContract.galleryPostsShow)
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const post = await deps.galleryPostsRepository.findOneBy({
				id: ps.postId,
			});
			if (post == null) {
				throw apiError(collectionsErrors.galleryPostsShow.noSuchPost);
			}
			return toPackedGalleryPost(await deps.galleryPostEntityService.pack(post, me));
		});
}
