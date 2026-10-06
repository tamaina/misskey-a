/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedNoteSchema as __ref_Note
} from '../../notes/contract/packed.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedClipSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"lastClippedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user": v.lazy(() => __ref_UserLite),
	"name": v.string(),
	"description": v.nullable(v.string()),
	"isPublic": v.boolean(),
	"favoritedCount": v.number(),
	"isFavorited": v.optional(v.boolean()),
	"notesCount": v.optional(v.pipe(v.number(), v.integer()))
});
export const packedNoteFavoriteSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"note": v.lazy(() => __ref_Note),
	"noteId": v.pipe(v.string(), v.metadata({ "format": "id" }))
});
