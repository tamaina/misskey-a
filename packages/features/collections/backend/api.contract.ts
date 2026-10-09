/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { collectionsInputs, collectionsOutputs } from './api.schema.js';
import type { OpenAPI } from '@orpc/contract';

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];
export const collectionsContract = {
	clipsAddNote: oc.$meta<{ requestName: 'clips/add-note' }>({ requestName: 'clips/add-note' })
		.route({ method: 'POST', path: '/clips/add-note', operationId: 'post___clips___add-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_CLIPPED: { status: 400, data: apiErrorData }, TOO_MANY_CLIP_NOTES: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsAddNote).output(collectionsOutputs.clipsAddNote),
	clipsCreate: oc.$meta<{ requestName: 'clips/create' }>({ requestName: 'clips/create' })
		.route({ method: 'POST', path: '/clips/create', operationId: 'post___clips___create', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, TOO_MANY_CLIPS: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsCreate).output(collectionsOutputs.clipsCreate),
	clipsDelete: oc.$meta<{ requestName: 'clips/delete' }>({ requestName: 'clips/delete' })
		.route({ method: 'POST', path: '/clips/delete', operationId: 'post___clips___delete', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsDelete).output(collectionsOutputs.clipsDelete),
	clipsFavorite: oc.$meta<{ requestName: 'clips/favorite' }>({ requestName: 'clips/favorite' })
		.route({ method: 'POST', path: '/clips/favorite', operationId: 'post___clips___favorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsFavorite).output(collectionsOutputs.clipsFavorite),
	clipsList: oc.$meta<{ requestName: 'clips/list' }>({ requestName: 'clips/list' })
		.route({ method: 'POST', path: '/clips/list', operationId: 'post___clips___list', tags: ['clips', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.clipsList).output(collectionsOutputs.clipsList),
	clipsMyFavorites: oc.$meta<{ requestName: 'clips/my-favorites' }>({ requestName: 'clips/my-favorites' })
		.route({ method: 'POST', path: '/clips/my-favorites', operationId: 'post___clips___my-favorites', tags: ['account', 'clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.clipsMyFavorites).output(collectionsOutputs.clipsMyFavorites),
	clipsNotes: oc.$meta<{ requestName: 'clips/notes' }>({ requestName: 'clips/notes' })
		.route({ method: 'POST', path: '/clips/notes', operationId: 'post___clips___notes', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsNotes).output(collectionsOutputs.clipsNotes),
	clipsRemoveNote: oc.$meta<{ requestName: 'clips/remove-note' }>({ requestName: 'clips/remove-note' })
		.route({ method: 'POST', path: '/clips/remove-note', operationId: 'post___clips___remove-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsRemoveNote).output(collectionsOutputs.clipsRemoveNote),
	clipsShow: oc.$meta<{ requestName: 'clips/show' }>({ requestName: 'clips/show' })
		.route({ method: 'POST', path: '/clips/show', operationId: 'post___clips___show', tags: ['clips', 'account'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsShow).output(collectionsOutputs.clipsShow),
	clipsUnfavorite: oc.$meta<{ requestName: 'clips/unfavorite' }>({ requestName: 'clips/unfavorite' })
		.route({ method: 'POST', path: '/clips/unfavorite', operationId: 'post___clips___unfavorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsUnfavorite).output(collectionsOutputs.clipsUnfavorite),
	clipsUpdate: oc.$meta<{ requestName: 'clips/update' }>({ requestName: 'clips/update' })
		.route({ method: 'POST', path: '/clips/update', operationId: 'post___clips___update', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.clipsUpdate).output(collectionsOutputs.clipsUpdate),
	galleryFeatured: oc.$meta<{ requestName: 'gallery/featured' }>({ requestName: 'gallery/featured' })
		.route({ method: 'POST', path: '/gallery/featured', operationId: 'post___gallery___featured', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.galleryFeatured).output(collectionsOutputs.galleryFeatured),
	galleryPopular: oc.$meta<{ requestName: 'gallery/popular' }>({ requestName: 'gallery/popular' })
		.route({ method: 'POST', path: '/gallery/popular', operationId: 'post___gallery___popular', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.galleryPopular).output(collectionsOutputs.galleryPopular),
	galleryPosts: oc.$meta<{ requestName: 'gallery/posts' }>({ requestName: 'gallery/posts' })
		.route({ method: 'POST', path: '/gallery/posts', operationId: 'post___gallery___posts', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.galleryPosts).output(collectionsOutputs.galleryPosts),
	galleryPostsCreate: oc.$meta<{ requestName: 'gallery/posts/create' }>({ requestName: 'gallery/posts/create' })
		.route({ method: 'POST', path: '/gallery/posts/create', operationId: 'post___gallery___posts___create', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.galleryPostsCreate).output(collectionsOutputs.galleryPostsCreate),
	galleryPostsDelete: oc.$meta<{ requestName: 'gallery/posts/delete' }>({ requestName: 'gallery/posts/delete' })
		.route({ method: 'POST', path: '/gallery/posts/delete', operationId: 'post___gallery___posts___delete', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.galleryPostsDelete).output(collectionsOutputs.galleryPostsDelete),
	galleryPostsLike: oc.$meta<{ requestName: 'gallery/posts/like' }>({ requestName: 'gallery/posts/like' })
		.route({ method: 'POST', path: '/gallery/posts/like', operationId: 'post___gallery___posts___like', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, YOUR_POST: { status: 400, data: apiErrorData }, ALREADY_LIKED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.galleryPostsLike).output(collectionsOutputs.galleryPostsLike),
	galleryPostsShow: oc.$meta<{ requestName: 'gallery/posts/show' }>({ requestName: 'gallery/posts/show' })
		.route({ method: 'POST', path: '/gallery/posts/show', operationId: 'post___gallery___posts___show', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.galleryPostsShow).output(collectionsOutputs.galleryPostsShow),
	galleryPostsUnlike: oc.$meta<{ requestName: 'gallery/posts/unlike' }>({ requestName: 'gallery/posts/unlike' })
		.route({ method: 'POST', path: '/gallery/posts/unlike', operationId: 'post___gallery___posts___unlike', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, NOT_LIKED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.galleryPostsUnlike).output(collectionsOutputs.galleryPostsUnlike),
	galleryPostsUpdate: oc.$meta<{ requestName: 'gallery/posts/update' }>({ requestName: 'gallery/posts/update' })
		.route({ method: 'POST', path: '/gallery/posts/update', operationId: 'post___gallery___posts___update', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.galleryPostsUpdate).output(collectionsOutputs.galleryPostsUpdate),
	iFavorites: oc.$meta<{ requestName: 'i/favorites' }>({ requestName: 'i/favorites' })
		.route({ method: 'POST', path: '/i/favorites', operationId: 'post___i___favorites', tags: ['account', 'notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.iFavorites).output(collectionsOutputs.iFavorites),
	iGalleryLikes: oc.$meta<{ requestName: 'i/gallery/likes' }>({ requestName: 'i/gallery/likes' })
		.route({ method: 'POST', path: '/i/gallery/likes', operationId: 'post___i___gallery___likes', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.iGalleryLikes).output(collectionsOutputs.iGalleryLikes),
	iGalleryPosts: oc.$meta<{ requestName: 'i/gallery/posts' }>({ requestName: 'i/gallery/posts' })
		.route({ method: 'POST', path: '/i/gallery/posts', operationId: 'post___i___gallery___posts', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.iGalleryPosts).output(collectionsOutputs.iGalleryPosts),
	notesClips: oc.$meta<{ requestName: 'notes/clips' }>({ requestName: 'notes/clips' })
		.route({ method: 'POST', path: '/notes/clips', operationId: 'post___notes___clips', tags: ['clips', 'notes'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.notesClips).output(collectionsOutputs.notesClips),
	notesFavoritesCreate: oc.$meta<{ requestName: 'notes/favorites/create' }>({ requestName: 'notes/favorites/create' })
		.route({ method: 'POST', path: '/notes/favorites/create', operationId: 'post___notes___favorites___create', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.notesFavoritesCreate).output(collectionsOutputs.notesFavoritesCreate),
	notesFavoritesDelete: oc.$meta<{ requestName: 'notes/favorites/delete' }>({ requestName: 'notes/favorites/delete' })
		.route({ method: 'POST', path: '/notes/favorites/delete', operationId: 'post___notes___favorites___delete', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(collectionsInputs.notesFavoritesDelete).output(collectionsOutputs.notesFavoritesDelete),
	usersClips: oc.$meta<{ requestName: 'users/clips' }>({ requestName: 'users/clips' })
		.route({ method: 'POST', path: '/users/clips', operationId: 'post___users___clips', tags: ['users', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.usersClips).output(collectionsOutputs.usersClips),
	usersGalleryPosts: oc.$meta<{ requestName: 'users/gallery/posts' }>({ requestName: 'users/gallery/posts' })
		.route({ method: 'POST', path: '/users/gallery/posts', operationId: 'post___users___gallery___posts', tags: ['users', 'gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(collectionsInputs.usersGalleryPosts).output(collectionsOutputs.usersGalleryPosts),
};
