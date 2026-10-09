/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema as __ref_UserLite } from '../../users/backend/user.schema.js';
import { packedNoteSchema as __ref_Note } from '../../notes/backend/note.schema.js';
import { packedDriveFileSchema as __ref_DriveFile } from '../../notes/backend/drive.schema.js';
import type { OpenAPI } from '@orpc/contract';
import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { jsonString } from '../../api/backend/transport/string.schema.js';

export const galleryFileIdsUnique = v.check((values: string[]) => new Set(values).size === values.length, 'Expected unique file identifiers');

export const packedClipSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'lastClippedAt': v.pipe(v.nullable(v.string()), v.metadata({ 'format': 'date-time' })),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => __ref_UserLite),
	'name': v.string(),
	'description': v.nullable(v.string()),
	'isPublic': v.boolean(),
	'favoritedCount': v.pipe(v.number(), v.finite()),
	'isFavorited': v.optional(v.boolean()),
	'notesCount': v.optional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
});

export const packedNoteFavoriteSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'note': v.lazy(() => __ref_Note),
	'noteId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
});

export const packedGalleryPostSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'updatedAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => __ref_UserLite),
	'title': v.string(),
	'description': v.nullable(v.string()),
	'fileIds': v.optional(v.array(v.pipe(v.string(), v.metadata({ 'format': 'id' })))),
	'files': v.optional(v.array(v.lazy(() => __ref_DriveFile))),
	'tags': v.optional(v.array(v.string())),
	'isSensitive': v.boolean(),
	'likedCount': v.pipe(v.number(), v.finite()),
	'isLiked': v.optional(v.boolean()),
});

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const publicSecurity: OpenAPI.SecurityRequirementObject[] = [{}, { bearerAuth: [] }];

export const collectionsContract = {
	clipsAddNote: oc.$meta({ requestName: 'clips/add-note' } as const)
		.route({ method: 'POST', path: '/clips/add-note', operationId: 'post___clips___add-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_CLIPPED: { status: 400, data: apiErrorData }, TOO_MANY_CLIP_NOTES: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId, noteId: misskeyId })).output(v.void()),
	clipsCreate: oc.$meta({ requestName: 'clips/create' } as const)
		.route({ method: 'POST', path: '/clips/create', operationId: 'post___clips___create', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, TOO_MANY_CLIPS: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'name': jsonString({ 'minLength': 1, 'maxLength': 100 }),
			'isPublic': v.optional(v.boolean(), false),
			'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
		})).output(packedClipSchema),
	clipsDelete: oc.$meta({ requestName: 'clips/delete' } as const)
		.route({ method: 'POST', path: '/clips/delete', operationId: 'post___clips___delete', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsFavorite: oc.$meta({ requestName: 'clips/favorite' } as const)
		.route({ method: 'POST', path: '/clips/favorite', operationId: 'post___clips___favorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsList: oc.$meta({ requestName: 'clips/list' } as const)
		.route({ method: 'POST', path: '/clips/list', operationId: 'post___clips___list', tags: ['clips', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedClipSchema)),
	clipsMyFavorites: oc.$meta({ requestName: 'clips/my-favorites' } as const)
		.route({ method: 'POST', path: '/clips/my-favorites', operationId: 'post___clips___my-favorites', tags: ['account', 'clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.array(packedClipSchema)),
	clipsNotes: oc.$meta({ requestName: 'clips/notes' } as const)
		.route({ method: 'POST', path: '/clips/notes', operationId: 'post___clips___notes', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'clipId': misskeyId,
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'search': v.exactOptional(v.nullable(jsonString({ 'minLength': 1, 'maxLength': 100 }))),
		})).output(v.array(__ref_Note)),
	clipsRemoveNote: oc.$meta({ requestName: 'clips/remove-note' } as const)
		.route({ method: 'POST', path: '/clips/remove-note', operationId: 'post___clips___remove-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId, noteId: misskeyId })).output(v.void()),
	clipsShow: oc.$meta({ requestName: 'clips/show' } as const)
		.route({ method: 'POST', path: '/clips/show', operationId: 'post___clips___show', tags: ['clips', 'account'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'clipId': misskeyId,
		})).output(packedClipSchema),
	clipsUnfavorite: oc.$meta({ requestName: 'clips/unfavorite' } as const)
		.route({ method: 'POST', path: '/clips/unfavorite', operationId: 'post___clips___unfavorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsUpdate: oc.$meta({ requestName: 'clips/update' } as const)
		.route({ method: 'POST', path: '/clips/update', operationId: 'post___clips___update', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'clipId': misskeyId,
			'name': v.exactOptional(jsonString({ 'minLength': 1, 'maxLength': 100 })),
			'isPublic': v.exactOptional(v.boolean()),
			'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
		})).output(packedClipSchema),
	galleryFeatured: oc.$meta({ requestName: 'gallery/featured' } as const)
		.route({ method: 'POST', path: '/gallery/featured', operationId: 'post___gallery___featured', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'untilId': v.exactOptional(misskeyId),
		})).output(v.array(packedGalleryPostSchema)),
	galleryPopular: oc.$meta({ requestName: 'gallery/popular' } as const)
		.route({ method: 'POST', path: '/gallery/popular', operationId: 'post___gallery___popular', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.array(packedGalleryPostSchema)),
	galleryPosts: oc.$meta({ requestName: 'gallery/posts' } as const)
		.route({ method: 'POST', path: '/gallery/posts', operationId: 'post___gallery___posts', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedGalleryPostSchema)),
	galleryPostsCreate: oc.$meta({ requestName: 'gallery/posts/create' } as const)
		.route({ method: 'POST', path: '/gallery/posts/create', operationId: 'post___gallery___posts___create', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'title': jsonString({ 'minLength': 1 }),
			'description': v.exactOptional(v.nullable(v.string())),
			'fileIds': v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32)),
			'isSensitive': v.optional(v.boolean(), false),
		})).output(packedGalleryPostSchema),
	galleryPostsDelete: oc.$meta({ requestName: 'gallery/posts/delete' } as const)
		.route({ method: 'POST', path: '/gallery/posts/delete', operationId: 'post___gallery___posts___delete', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsLike: oc.$meta({ requestName: 'gallery/posts/like' } as const)
		.route({ method: 'POST', path: '/gallery/posts/like', operationId: 'post___gallery___posts___like', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, YOUR_POST: { status: 400, data: apiErrorData }, ALREADY_LIKED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsShow: oc.$meta({ requestName: 'gallery/posts/show' } as const)
		.route({ method: 'POST', path: '/gallery/posts/show', operationId: 'post___gallery___posts___show', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(packedGalleryPostSchema),
	galleryPostsUnlike: oc.$meta({ requestName: 'gallery/posts/unlike' } as const)
		.route({ method: 'POST', path: '/gallery/posts/unlike', operationId: 'post___gallery___posts___unlike', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, NOT_LIKED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsUpdate: oc.$meta({ requestName: 'gallery/posts/update' } as const)
		.route({ method: 'POST', path: '/gallery/posts/update', operationId: 'post___gallery___posts___update', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'postId': misskeyId,
			'title': v.exactOptional(jsonString({ 'minLength': 1 })),
			'description': v.exactOptional(v.nullable(v.string())),
			'fileIds': v.exactOptional(v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32))),
			'isSensitive': v.optional(v.boolean(), false),
		})).output(packedGalleryPostSchema),
	iFavorites: oc.$meta({ requestName: 'i/favorites' } as const)
		.route({ method: 'POST', path: '/i/favorites', operationId: 'post___i___favorites', tags: ['account', 'notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedNoteFavoriteSchema)),
	iGalleryLikes: oc.$meta({ requestName: 'i/gallery/likes' } as const)
		.route({ method: 'POST', path: '/i/gallery/likes', operationId: 'post___i___gallery___likes', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'post': packedGalleryPostSchema,
}))),
	iGalleryPosts: oc.$meta({ requestName: 'i/gallery/posts' } as const)
		.route({ method: 'POST', path: '/i/gallery/posts', operationId: 'post___i___gallery___posts', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedGalleryPostSchema)),
	notesClips: oc.$meta({ requestName: 'notes/clips' } as const)
		.route({ method: 'POST', path: '/notes/clips', operationId: 'post___notes___clips', tags: ['clips', 'notes'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.array(packedClipSchema)),
	notesFavoritesCreate: oc.$meta({ requestName: 'notes/favorites/create' } as const)
		.route({ method: 'POST', path: '/notes/favorites/create', operationId: 'post___notes___favorites___create', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.void()),
	notesFavoritesDelete: oc.$meta({ requestName: 'notes/favorites/delete' } as const)
		.route({ method: 'POST', path: '/notes/favorites/delete', operationId: 'post___notes___favorites___delete', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.void()),
	usersClips: oc.$meta({ requestName: 'users/clips' } as const)
		.route({ method: 'POST', path: '/users/clips', operationId: 'post___users___clips', tags: ['users', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'userId': misskeyId,
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedClipSchema)),
	usersGalleryPosts: oc.$meta({ requestName: 'users/gallery/posts' } as const)
		.route({ method: 'POST', path: '/users/gallery/posts', operationId: 'post___users___gallery___posts', tags: ['users', 'gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'userId': misskeyId,
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedGalleryPostSchema)),
};
