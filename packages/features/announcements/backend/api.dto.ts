/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferSchemaOutput } from '@orpc/contract';
import type { announcementOutput } from './api.definition.js';

type Announcement = InferSchemaOutput<typeof announcementOutput>;

export function toPackedAnnouncement(value: Announcement): Announcement {
	return {
		id: value.id,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		title: value.title,
		text: value.text,
		imageUrl: value.imageUrl,
		icon: value.icon,
		display: value.display,
		needConfirmationToRead: value.needConfirmationToRead,
		silence: value.silence,
		forYou: value.forYou,
		isRead: value.isRead,
	};
}
