/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { jsonString } from '../../api/backend/transport/string.schema.js';
import { packedUserLiteSchema as __ref_UserLite } from '../../users/backend/user.schema.js';
import { packedNoteSchema as __ref_Note } from '../../notes/backend/note.schema.js';
import { packedDriveFileSchema as __ref_DriveFile } from '../../notes/backend/drive.schema.js';

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
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
export const clipsAddNoteInput = objectInput({ clipId: misskeyId, noteId: misskeyId });
export const packedClipsCreateInput = objectInput({
	'name': jsonString({ 'minLength': 1, 'maxLength': 100 }),
	'isPublic': v.optional(v.boolean(), false),
	'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
});
export const clipsDeleteInput = objectInput({ clipId: misskeyId });
export const clipsFavoriteInput = objectInput({ clipId: misskeyId });
export const packedClipsListInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedClipsMyFavoritesInput = objectInput({});
export const packedClipsNotesInput = objectInput({
	'clipId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'search': v.exactOptional(v.nullable(jsonString({ 'minLength': 1, 'maxLength': 100 }))),
});
export const clipsRemoveNoteInput = objectInput({ clipId: misskeyId, noteId: misskeyId });
export const packedClipsShowInput = objectInput({
	'clipId': misskeyId,
});
export const clipsUnfavoriteInput = objectInput({ clipId: misskeyId });
export const packedClipsUpdateInput = objectInput({
	'clipId': misskeyId,
	'name': v.exactOptional(jsonString({ 'minLength': 1, 'maxLength': 100 })),
	'isPublic': v.exactOptional(v.boolean()),
	'description': v.exactOptional(v.nullable(jsonString({ 'maxLength': 2048 }))),
});
export const packedGalleryFeaturedInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'untilId': v.exactOptional(misskeyId),
});
export const packedGalleryPopularInput = objectInput({});
export const packedGalleryPostsInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const uniqueGalleryPostsCreateInput = objectInput({
	'title': jsonString({ 'minLength': 1 }),
	'description': v.exactOptional(v.nullable(v.string())),
	'fileIds': v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32)),
	'isSensitive': v.optional(v.boolean(), false),
});
export const voidGalleryPostsDeleteInput = objectInput({
	'postId': misskeyId,
});
export const voidGalleryPostsLikeInput = objectInput({
	'postId': misskeyId,
});
export const packedGalleryPostsShowInput = objectInput({
	'postId': misskeyId,
});
export const voidGalleryPostsUnlikeInput = objectInput({
	'postId': misskeyId,
});
export const uniqueGalleryPostsUpdateInput = objectInput({
	'postId': misskeyId,
	'title': v.exactOptional(jsonString({ 'minLength': 1 })),
	'description': v.exactOptional(v.nullable(v.string())),
	'fileIds': v.exactOptional(v.pipe(v.pipe(v.array(misskeyId), galleryFileIdsUnique), v.minLength(1), v.maxLength(32))),
	'isSensitive': v.optional(v.boolean(), false),
});
export const packedIFavoritesInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIGalleryLikesInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedIGalleryPostsInput = objectInput({
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedNotesClipsInput = objectInput({
	'noteId': misskeyId,
});
export const voidNotesFavoritesCreateInput = objectInput({
	'noteId': misskeyId,
});
export const voidNotesFavoritesDeleteInput = objectInput({
	'noteId': misskeyId,
});
export const packedUsersClipsInput = objectInput({
	'userId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedUsersGalleryPostsInput = objectInput({
	'userId': misskeyId,
	'limit': v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	'sinceId': v.exactOptional(misskeyId),
	'untilId': v.exactOptional(misskeyId),
	'sinceDate': v.exactOptional(v.pipe(v.number(), v.integer())),
	'untilDate': v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const collectionsInputs = {
	clipsAddNote: clipsAddNoteInput,
	clipsCreate: packedClipsCreateInput,
	clipsDelete: clipsDeleteInput,
	clipsFavorite: clipsFavoriteInput,
	clipsList: packedClipsListInput,
	clipsMyFavorites: packedClipsMyFavoritesInput,
	clipsNotes: packedClipsNotesInput,
	clipsRemoveNote: clipsRemoveNoteInput,
	clipsShow: packedClipsShowInput,
	clipsUnfavorite: clipsUnfavoriteInput,
	clipsUpdate: packedClipsUpdateInput,
	galleryFeatured: packedGalleryFeaturedInput,
	galleryPopular: packedGalleryPopularInput,
	galleryPosts: packedGalleryPostsInput,
	galleryPostsCreate: uniqueGalleryPostsCreateInput,
	galleryPostsDelete: voidGalleryPostsDeleteInput,
	galleryPostsLike: voidGalleryPostsLikeInput,
	galleryPostsShow: packedGalleryPostsShowInput,
	galleryPostsUnlike: voidGalleryPostsUnlikeInput,
	galleryPostsUpdate: uniqueGalleryPostsUpdateInput,
	iFavorites: packedIFavoritesInput,
	iGalleryLikes: packedIGalleryLikesInput,
	iGalleryPosts: packedIGalleryPostsInput,
	notesClips: packedNotesClipsInput,
	notesFavoritesCreate: voidNotesFavoritesCreateInput,
	notesFavoritesDelete: voidNotesFavoritesDeleteInput,
	usersClips: packedUsersClipsInput,
	usersGalleryPosts: packedUsersGalleryPostsInput,
};

export const collectionsOutputs = {
	clipsAddNote: v.void(),
	clipsCreate: packedClipSchema,
	clipsDelete: v.void(),
	clipsFavorite: v.void(),
	clipsList: v.array(packedClipSchema),
	clipsMyFavorites: v.array(packedClipSchema),
	clipsNotes: v.array(__ref_Note),
	clipsRemoveNote: v.void(),
	clipsShow: packedClipSchema,
	clipsUnfavorite: v.void(),
	clipsUpdate: packedClipSchema,
	galleryFeatured: v.array(packedGalleryPostSchema),
	galleryPopular: v.array(packedGalleryPostSchema),
	galleryPosts: v.array(packedGalleryPostSchema),
	galleryPostsCreate: packedGalleryPostSchema,
	galleryPostsDelete: v.void(),
	galleryPostsLike: v.void(),
	galleryPostsShow: packedGalleryPostSchema,
	galleryPostsUnlike: v.void(),
	galleryPostsUpdate: packedGalleryPostSchema,
	iFavorites: v.array(packedNoteFavoriteSchema),
	iGalleryLikes: v.array(v.strictObject({
		'id': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
		'post': packedGalleryPostSchema,
	})),
	iGalleryPosts: v.array(packedGalleryPostSchema),
	notesClips: v.array(packedClipSchema),
	notesFavoritesCreate: v.void(),
	notesFavoritesDelete: v.void(),
	usersClips: v.array(packedClipSchema),
	usersGalleryPosts: v.array(packedGalleryPostSchema),
};
