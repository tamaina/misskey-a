/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

const date = v.pipe(v.string(), v.metadata({ format: 'date-time' }));
const icon = v.picklist(['info', 'warning', 'error', 'success']);
const display = v.picklist(['normal', 'banner', 'dialog']);
export const announcementOutput = v.strictObject({
	id: v.string(), createdAt: date, updatedAt: v.nullable(date),
	title: v.string(), text: v.string(), imageUrl: v.nullable(v.string()), icon, display,
	needConfirmationToRead: v.boolean(), silence: v.boolean(), forYou: v.boolean(),
	isRead: v.optional(v.boolean()),
});
