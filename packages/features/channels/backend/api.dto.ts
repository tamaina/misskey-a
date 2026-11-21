/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/backend/packed.schema.js';
import { toPackedNote } from '@features/notes/backend/note.schema.js';
export function toPackedChannel(value: Packed<'Channel'>): Packed<'Channel'> {
	return {
		id: value.id,
		createdAt: value.createdAt,
		lastNotedAt: value.lastNotedAt,
		name: value.name,
		description: value.description,
		userId: value.userId,
		bannerUrl: value.bannerUrl,
		bannerId: value.bannerId,
		pinnedNoteIds: value.pinnedNoteIds,
		color: value.color,
		isArchived: value.isArchived,
		usersCount: value.usersCount,
		notesCount: value.notesCount,
		isSensitive: value.isSensitive,
		allowRenoteToExternal: value.allowRenoteToExternal,
		isFollowing: value.isFollowing,
		isFavorited: value.isFavorited,
		isMuting: value.isMuting,
		hasUnreadNote: value.hasUnreadNote,
		pinnedNotes: value.pinnedNotes?.map(toPackedNote),
	};
}
