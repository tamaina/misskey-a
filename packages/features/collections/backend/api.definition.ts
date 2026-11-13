/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../api/backend/transport/policy.types.js';

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
	clipsAddNote: oc.$meta({
		requestName: 'clips/add-note',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:account',
		limit: {
			duration: 3600000,
			max: 20,
		},
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/add-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_CLIPPED: { status: 400, data: apiErrorData }, TOO_MANY_CLIP_NOTES: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId, noteId: misskeyId })).output(v.void()),
	clipsCreate: oc.$meta({
		requestName: 'clips/create',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/create', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, TOO_MANY_CLIPS: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'name': jsonString({ 'minLength': 1, 'maxLength': 100 }),
			'isPublic': v.optional(v.boolean(), false),
			'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
		})).output(packedClipSchema),
	clipsDelete: oc.$meta({
		requestName: 'clips/delete',
		requireCredential: true,
		kind: 'write:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/delete', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsFavorite: oc.$meta({
		requestName: 'clips/favorite',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:clip-favorite',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/favorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsList: oc.$meta({
		requestName: 'clips/list',
		requireCredential: true,
		kind: 'read:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/list', tags: ['clips', 'account'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedClipSchema)),
	clipsMyFavorites: oc.$meta({
		requestName: 'clips/my-favorites',
		requireCredential: true,
		kind: 'read:clip-favorite',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/my-favorites', tags: ['account', 'clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.array(packedClipSchema)),
	clipsNotes: oc.$meta({
		requestName: 'clips/notes',
		requireCredential: false,
		kind: 'read:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/notes', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
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
	clipsRemoveNote: oc.$meta({
		requestName: 'clips/remove-note',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/remove-note', tags: ['account', 'notes', 'clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId, noteId: misskeyId })).output(v.void()),
	clipsShow: oc.$meta({
		requestName: 'clips/show',
		requireCredential: false,
		kind: 'read:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/show', tags: ['clips', 'account'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'clipId': misskeyId,
		})).output(packedClipSchema),
	clipsUnfavorite: oc.$meta({
		requestName: 'clips/unfavorite',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:clip-favorite',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/unfavorite', tags: ['clip'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({ clipId: misskeyId })).output(v.void()),
	clipsUpdate: oc.$meta({
		requestName: 'clips/update',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:account',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/clips/update', tags: ['clips'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_CLIP: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'clipId': misskeyId,
			'name': v.exactOptional(jsonString({ 'minLength': 1, 'maxLength': 100 })),
			'isPublic': v.exactOptional(v.boolean()),
			'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
		})).output(packedClipSchema),
	galleryFeatured: oc.$meta({
		requestName: 'gallery/featured',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/featured', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'untilId': v.exactOptional(misskeyId),
		})).output(v.array(packedGalleryPostSchema)),
	galleryPopular: oc.$meta({
		requestName: 'gallery/popular',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/popular', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({})).output(v.array(packedGalleryPostSchema)),
	galleryPosts: oc.$meta({
		requestName: 'gallery/posts',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedGalleryPostSchema)),
	galleryPostsCreate: oc.$meta({
		requestName: 'gallery/posts/create',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:gallery',
		limit: {
			duration: 3600000,
			max: 20,
		},
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/create', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'title': jsonString({ 'minLength': 1 }),
			'description': v.exactOptional(v.nullable(v.string())),
			'fileIds': v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32)),
			'isSensitive': v.optional(v.boolean(), false),
		})).output(packedGalleryPostSchema),
	galleryPostsDelete: oc.$meta({
		requestName: 'gallery/posts/delete',
		requireCredential: true,
		kind: 'write:gallery',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/delete', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsLike: oc.$meta({
		requestName: 'gallery/posts/like',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:gallery-likes',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/like', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, YOUR_POST: { status: 400, data: apiErrorData }, ALREADY_LIKED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsShow: oc.$meta({
		requestName: 'gallery/posts/show',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/show', tags: ['gallery'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(packedGalleryPostSchema),
	galleryPostsUnlike: oc.$meta({
		requestName: 'gallery/posts/unlike',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:gallery-likes',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/unlike', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_POST: { status: 400, data: apiErrorData }, NOT_LIKED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'postId': misskeyId,
		})).output(v.void()),
	galleryPostsUpdate: oc.$meta({
		requestName: 'gallery/posts/update',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:gallery',
		limit: {
			duration: 3600000,
			max: 300,
		},
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/gallery/posts/update', tags: ['gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'postId': misskeyId,
			'title': v.exactOptional(jsonString({ 'minLength': 1 })),
			'description': v.exactOptional(v.nullable(v.string())),
			'fileIds': v.exactOptional(v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32))),
			'isSensitive': v.optional(v.boolean(), false),
		})).output(packedGalleryPostSchema),
	iFavorites: oc.$meta({
		requestName: 'i/favorites',
		requireCredential: true,
		kind: 'read:favorites',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/i/favorites', tags: ['account', 'notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedNoteFavoriteSchema)),
	iGalleryLikes: oc.$meta({
		requestName: 'i/gallery/likes',
		requireCredential: true,
		kind: 'read:gallery-likes',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/i/gallery/likes', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
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
	iGalleryPosts: oc.$meta({
		requestName: 'i/gallery/posts',
		requireCredential: true,
		kind: 'read:gallery',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/i/gallery/posts', tags: ['account', 'gallery'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedGalleryPostSchema)),
	notesClips: oc.$meta({
		requestName: 'notes/clips',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/notes/clips', tags: ['clips', 'notes'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.array(packedClipSchema)),
	notesFavoritesCreate: oc.$meta({
		requestName: 'notes/favorites/create',
		requireCredential: true,
		prohibitMoved: true,
		kind: 'write:favorites',
		limit: {
			duration: 3600000,
			max: 20,
		},
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/notes/favorites/create', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, ALREADY_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.void()),
	notesFavoritesDelete: oc.$meta({
		requestName: 'notes/favorites/delete',
		requireCredential: true,
		kind: 'write:favorites',
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/notes/favorites/delete', tags: ['notes', 'favorites'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
		.errors({ ...commonErrors, NO_SUCH_NOTE: { status: 400, data: apiErrorData }, NOT_FAVORITED: { status: 400, data: apiErrorData } })
		.input(objectInput({
			'noteId': misskeyId,
		})).output(v.void()),
	usersClips: oc.$meta({
		requestName: 'users/clips',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/users/clips', tags: ['users', 'clips'], spec: current => ({ ...current, security: publicSecurity }) })
		.errors({ ...commonErrors })
		.input(objectInput({
			'userId': misskeyId,
			'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
			'sinceId': v.exactOptional(misskeyId),
			'untilId': v.exactOptional(misskeyId),
			'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
			'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
		})).output(v.array(packedClipSchema)),
	usersGalleryPosts: oc.$meta({
		requestName: 'users/gallery/posts',
		requireCredential: false,
	} as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/users/gallery/posts', tags: ['users', 'gallery'], spec: current => ({ ...current, security: publicSecurity }) })
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
