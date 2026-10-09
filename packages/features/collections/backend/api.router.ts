/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal, decodeScalarInput } from '../../api/backend/transport/middleware.js';
import { collectionsContract } from './api.contract.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { CollectionsOperations } from './api.operations.js';

export type CollectionsContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { collections: CollectionsOperations<Actor> } };
export function createCollectionsRouter<Actor extends ApiActor>() {
	const api = implement(collectionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<CollectionsContext<Actor>>().use(authentication<Actor>());
	return api.router({
		clipsAddNote: api.clipsAddNote.use(apiPolicy<Actor>({ name: 'clips/add-note', requireCredential: true, prohibitMoved: true, kind: 'write:account', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsAddNote(input, context.principal)),
		clipsCreate: api.clipsCreate.use(apiPolicy<Actor>({ name: 'clips/create', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsCreate(input, context.principal)),
		clipsDelete: api.clipsDelete.use(apiPolicy<Actor>({ name: 'clips/delete', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsDelete(input, context.principal)),
		clipsFavorite: api.clipsFavorite.use(apiPolicy<Actor>({ name: 'clips/favorite', requireCredential: true, prohibitMoved: true, kind: 'write:clip-favorite' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsFavorite(input, context.principal)),
		clipsList: api.clipsList.use(apiPolicy<Actor>({ name: 'clips/list', requireCredential: true, kind: 'read:account' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.clipsList(input, context.principal)),
		clipsMyFavorites: api.clipsMyFavorites.use(apiPolicy<Actor>({ name: 'clips/my-favorites', requireCredential: true, kind: 'read:clip-favorite' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsMyFavorites(input, context.principal)),
		clipsNotes: api.clipsNotes.use(apiPolicy<Actor>({ name: 'clips/notes', kind: 'read:account' })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.clipsNotes(input, context.principal)),
		clipsRemoveNote: api.clipsRemoveNote.use(apiPolicy<Actor>({ name: 'clips/remove-note', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsRemoveNote(input, context.principal)),
		clipsShow: api.clipsShow.use(apiPolicy<Actor>({ name: 'clips/show', kind: 'read:account' }))
			.handler(({ input, context }) => context.operations.collections.clipsShow(input, context.principal)),
		clipsUnfavorite: api.clipsUnfavorite.use(apiPolicy<Actor>({ name: 'clips/unfavorite', requireCredential: true, prohibitMoved: true, kind: 'write:clip-favorite' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsUnfavorite(input, context.principal)),
		clipsUpdate: api.clipsUpdate.use(apiPolicy<Actor>({ name: 'clips/update', requireCredential: true, prohibitMoved: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.clipsUpdate(input, context.principal)),
		galleryFeatured: api.galleryFeatured.use(apiPolicy<Actor>({ name: 'gallery/featured' })).use(decodeScalarInput<Actor>({ limit: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.galleryFeatured(input, context.principal)),
		galleryPopular: api.galleryPopular.use(apiPolicy<Actor>({ name: 'gallery/popular' }))
			.handler(({ input, context }) => context.operations.collections.galleryPopular(input, context.principal)),
		galleryPosts: api.galleryPosts.use(apiPolicy<Actor>({ name: 'gallery/posts' })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.galleryPosts(input, context.principal)),
		galleryPostsCreate: api.galleryPostsCreate.use(apiPolicy<Actor>({ name: 'gallery/posts/create', requireCredential: true, prohibitMoved: true, kind: 'write:gallery', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isSensitive: 'boolean' }))
			.handler(({ input, context }) => context.operations.collections.galleryPostsCreate(input, context.principal)),
		galleryPostsDelete: api.galleryPostsDelete.use(apiPolicy<Actor>({ name: 'gallery/posts/delete', requireCredential: true, kind: 'write:gallery' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.galleryPostsDelete(input, context.principal)),
		galleryPostsLike: api.galleryPostsLike.use(apiPolicy<Actor>({ name: 'gallery/posts/like', requireCredential: true, prohibitMoved: true, kind: 'write:gallery-likes' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.galleryPostsLike(input, context.principal)),
		galleryPostsShow: api.galleryPostsShow.use(apiPolicy<Actor>({ name: 'gallery/posts/show' }))
			.handler(({ input, context }) => context.operations.collections.galleryPostsShow(input, context.principal)),
		galleryPostsUnlike: api.galleryPostsUnlike.use(apiPolicy<Actor>({ name: 'gallery/posts/unlike', requireCredential: true, prohibitMoved: true, kind: 'write:gallery-likes' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.galleryPostsUnlike(input, context.principal)),
		galleryPostsUpdate: api.galleryPostsUpdate.use(apiPolicy<Actor>({ name: 'gallery/posts/update', requireCredential: true, prohibitMoved: true, kind: 'write:gallery', limit: { duration: 3600000, max: 300 } })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ isSensitive: 'boolean' }))
			.handler(({ input, context }) => context.operations.collections.galleryPostsUpdate(input, context.principal)),
		iFavorites: api.iFavorites.use(apiPolicy<Actor>({ name: 'i/favorites', requireCredential: true, kind: 'read:favorites' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.iFavorites(input, context.principal)),
		iGalleryLikes: api.iGalleryLikes.use(apiPolicy<Actor>({ name: 'i/gallery/likes', requireCredential: true, kind: 'read:gallery-likes' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.iGalleryLikes(input, context.principal)),
		iGalleryPosts: api.iGalleryPosts.use(apiPolicy<Actor>({ name: 'i/gallery/posts', requireCredential: true, kind: 'read:gallery' })).use(requirePrincipal<Actor>()).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.iGalleryPosts(input, context.principal)),
		notesClips: api.notesClips.use(apiPolicy<Actor>({ name: 'notes/clips' }))
			.handler(({ input, context }) => context.operations.collections.notesClips(input, context.principal)),
		notesFavoritesCreate: api.notesFavoritesCreate.use(apiPolicy<Actor>({ name: 'notes/favorites/create', requireCredential: true, prohibitMoved: true, kind: 'write:favorites', limit: { duration: 3600000, max: 20 } })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.notesFavoritesCreate(input, context.principal)),
		notesFavoritesDelete: api.notesFavoritesDelete.use(apiPolicy<Actor>({ name: 'notes/favorites/delete', requireCredential: true, kind: 'write:favorites' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.collections.notesFavoritesDelete(input, context.principal)),
		usersClips: api.usersClips.use(apiPolicy<Actor>({ name: 'users/clips' })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.usersClips(input, context.principal)),
		usersGalleryPosts: api.usersGalleryPosts.use(apiPolicy<Actor>({ name: 'users/gallery/posts' })).use(decodeScalarInput<Actor>({ limit: 'integer', sinceDate: 'integer', untilDate: 'integer' }))
			.handler(({ input, context }) => context.operations.collections.usersGalleryPosts(input, context.principal)),
	});
}
