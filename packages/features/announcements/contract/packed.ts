/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

export const packedAnnouncementSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"text": v.string(),
	"title": v.string(),
	"imageUrl": v.nullable(v.string()),
	"icon": v.picklist(["info", "warning", "error", "success"]),
	"display": v.picklist(["dialog", "normal", "banner"]),
	"needConfirmationToRead": v.boolean(),
	"silence": v.boolean(),
	"forYou": v.boolean(),
	"isRead": v.optional(v.boolean())
});
