/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/backend/packed.schema.js';
import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
export function toPackedClip(value: Packed<'Clip'>): Packed<'Clip'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		lastClippedAt: value.lastClippedAt,
		userId: value.userId,
		user: toPackedUserLite(value.user),
		name: value.name,
		description: value.description,
		isPublic: value.isPublic,
		favoritedCount: value.favoritedCount,
		isFavorited: value.isFavorited,
		notesCount: value.notesCount,
	};
}
export function toPackedGalleryPost(value: Packed<'GalleryPost'>): Packed<'GalleryPost'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		userId: value.userId,
		user: toPackedUserLite(value.user),
		title: value.title,
		description: value.description,
		fileIds: value.fileIds,
		files: value.files?.map(toPackedDriveFile),
		tags: value.tags,
		isSensitive: value.isSensitive,
		likedCount: value.likedCount,
		isLiked: value.isLiked,
	};
}
export function toPackedNoteFavorite(value: Packed<'NoteFavorite'>): Packed<'NoteFavorite'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		noteId: value.noteId,
		note: toPackedNote(value.note),
	};
}
export function toPackedGalleryLike(value: { id: string; post: Packed<'GalleryPost'> }): { id: string; post: Packed<'GalleryPost'> } {
	return { id: value.id, post: toPackedGalleryPost(value.post) };
}
