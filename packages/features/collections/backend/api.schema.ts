/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { packedUserLiteSchema as __ref_UserLite } from '../../users/backend/user.schema.js';
import { packedNoteSchema as __ref_Note } from '../../notes/backend/note.schema.js';
import { packedDriveFileSchema as __ref_DriveFile } from '../../notes/backend/drive.schema.js';

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
