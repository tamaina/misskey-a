/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedNoteSchema as __ref_Note
} from '../../notes/contract/packed.js';

export const packedChannelSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"lastNotedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"name": v.string(),
	"description": v.nullable(v.string()),
	"userId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"bannerUrl": v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	"bannerId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"pinnedNoteIds": v.array(v.pipe(v.string(), v.metadata({ "format": "id" }))),
	"color": v.string(),
	"isArchived": v.boolean(),
	"usersCount": v.number(),
	"notesCount": v.number(),
	"isSensitive": v.boolean(),
	"allowRenoteToExternal": v.boolean(),
	"isFollowing": v.optional(v.boolean()),
	"isFavorited": v.optional(v.boolean()),
	"isMuting": v.optional(v.boolean()),
	"pinnedNotes": v.optional(v.array(v.lazy(() => __ref_Note)))
});
