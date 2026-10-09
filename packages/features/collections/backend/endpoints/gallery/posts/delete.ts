/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { collectionsContract } from '../../../api.definition.js';
import type { CollectionsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { collectionsErrors } from '../../../api.errors.js';
export interface GalleryPostsDeleteDependencies<Actor extends ApiActor> {
	galleryPostsRepository: Pick<CollectionsDependencies<Actor>['galleryPostsRepository'], 'delete' | 'findOneBy'>;
	roleService: Pick<CollectionsDependencies<Actor>['roleService'], 'isModerator'>;
	usersRepository: Pick<CollectionsDependencies<Actor>['usersRepository'], 'findOneByOrFail'>;
	moderationLogService: Pick<CollectionsDependencies<Actor>['moderationLogService'], 'log'>;
}
export function createGalleryPostsDeleteProcedure<Actor extends ApiActor>(deps: GalleryPostsDeleteDependencies<Actor>) {
	return implement(collectionsContract.galleryPostsDelete, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ name: collectionsContract.galleryPostsDelete['~orpc'].meta.requestName, requireCredential: true, kind: 'write:gallery' })).use(requirePrincipal<Actor>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			const post = await deps.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw apiError(collectionsErrors.galleryPostsDelete.noSuchPost);
			}
			if (!await deps.roleService.isModerator(me) && post.userId !== me.id) {
				throw apiError(collectionsErrors.galleryPostsDelete.accessDenied);
			}
			await deps.galleryPostsRepository.delete(post.id);
			if (post.userId !== me.id) {
				const user = await deps.usersRepository.findOneByOrFail({ id: post.userId });
				deps.moderationLogService.log(me, 'deleteGalleryPost', {
					postId: post.id,
					postUserId: post.userId,
					postUserUsername: user.username,
					post,
				});
			}
		});
}
