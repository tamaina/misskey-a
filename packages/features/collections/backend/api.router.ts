/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { collectionsContract } from './api.contract.js';
import type { CollectionsDependencies } from './api.dependencies.js';
import { createClipsAddNoteProcedure } from './endpoints/clips/add-note.js';
import { createClipsCreateProcedure } from './endpoints/clips/create.js';
import { createClipsDeleteProcedure } from './endpoints/clips/delete.js';
import { createClipsFavoriteProcedure } from './endpoints/clips/favorite.js';
import { createClipsListProcedure } from './endpoints/clips/list.js';
import { createClipsMyFavoritesProcedure } from './endpoints/clips/my-favorites.js';
import { createClipsNotesProcedure } from './endpoints/clips/notes.js';
import { createClipsRemoveNoteProcedure } from './endpoints/clips/remove-note.js';
import { createClipsShowProcedure } from './endpoints/clips/show.js';
import { createClipsUnfavoriteProcedure } from './endpoints/clips/unfavorite.js';
import { createClipsUpdateProcedure } from './endpoints/clips/update.js';
import { createGalleryFeaturedProcedure } from './endpoints/gallery/featured.js';
import { createGalleryPopularProcedure } from './endpoints/gallery/popular.js';
import { createGalleryPostsProcedure } from './endpoints/gallery/posts.js';
import { createGalleryPostsCreateProcedure } from './endpoints/gallery/posts/create.js';
import { createGalleryPostsDeleteProcedure } from './endpoints/gallery/posts/delete.js';
import { createGalleryPostsLikeProcedure } from './endpoints/gallery/posts/like.js';
import { createGalleryPostsShowProcedure } from './endpoints/gallery/posts/show.js';
import { createGalleryPostsUnlikeProcedure } from './endpoints/gallery/posts/unlike.js';
import { createGalleryPostsUpdateProcedure } from './endpoints/gallery/posts/update.js';
import { createIFavoritesProcedure } from './endpoints/i/favorites.js';
import { createIGalleryLikesProcedure } from './endpoints/i/gallery/likes.js';
import { createIGalleryPostsProcedure } from './endpoints/i/gallery/posts.js';
import { createNotesClipsProcedure } from './endpoints/notes/clips.js';
import { createNotesFavoritesCreateProcedure } from './endpoints/notes/favorites/create.js';
import { createNotesFavoritesDeleteProcedure } from './endpoints/notes/favorites/delete.js';
import { createUsersClipsProcedure } from './endpoints/users/clips.js';
import { createUsersGalleryPostsProcedure } from './endpoints/users/gallery/posts.js';
export function createCollectionsRouter<Actor extends ApiActor>(deps: CollectionsDependencies<Actor>) {
	return implement(collectionsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		clipsAddNote: createClipsAddNoteProcedure(deps),
		clipsCreate: createClipsCreateProcedure(deps),
		clipsDelete: createClipsDeleteProcedure(deps),
		clipsFavorite: createClipsFavoriteProcedure(deps),
		clipsList: createClipsListProcedure(deps),
		clipsMyFavorites: createClipsMyFavoritesProcedure(deps),
		clipsNotes: createClipsNotesProcedure(deps),
		clipsRemoveNote: createClipsRemoveNoteProcedure(deps),
		clipsShow: createClipsShowProcedure(deps),
		clipsUnfavorite: createClipsUnfavoriteProcedure(deps),
		clipsUpdate: createClipsUpdateProcedure(deps),
		galleryFeatured: createGalleryFeaturedProcedure(deps),
		galleryPopular: createGalleryPopularProcedure(deps),
		galleryPosts: createGalleryPostsProcedure(deps),
		galleryPostsCreate: createGalleryPostsCreateProcedure(deps),
		galleryPostsDelete: createGalleryPostsDeleteProcedure(deps),
		galleryPostsLike: createGalleryPostsLikeProcedure(deps),
		galleryPostsShow: createGalleryPostsShowProcedure(deps),
		galleryPostsUnlike: createGalleryPostsUnlikeProcedure(deps),
		galleryPostsUpdate: createGalleryPostsUpdateProcedure(deps),
		iFavorites: createIFavoritesProcedure(deps),
		iGalleryLikes: createIGalleryLikesProcedure(deps),
		iGalleryPosts: createIGalleryPostsProcedure(deps),
		notesClips: createNotesClipsProcedure(deps),
		notesFavoritesCreate: createNotesFavoritesCreateProcedure(deps),
		notesFavoritesDelete: createNotesFavoritesDeleteProcedure(deps),
		usersClips: createUsersClipsProcedure(deps),
		usersGalleryPosts: createUsersGalleryPostsProcedure(deps),
	});
}
