/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import {
	packedDriveFileSchema as __ref_DriveFile
} from '../../drive/contract/packed.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

const noteBaseSchema = resultObject({
"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
"deletedAt": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" }))),
"text": v.nullable(v.string()),
"cw": v.optional(v.nullable(v.string())),
"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
"user": v.lazy(() => __ref_UserLite),
"replyId": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" }))),
"renoteId": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" }))),
"isHidden": v.optional(v.boolean()),
"visibility": v.picklist(["public", "home", "followers", "specified"]),
"mentions": v.optional(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
"visibleUserIds": v.optional(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
"fileIds": v.optional(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
"files": v.optional(v.array(v.lazy(() => __ref_DriveFile))),
"tags": v.optional(v.array(v.string())),
"poll": v.optional(v.nullable(resultObject({
	"expiresAt": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" }))),
	"multiple": v.boolean(),
	"choices": v.array(resultObject({
	"isVoted": v.boolean(),
	"text": v.string(),
	"votes": v.number()
}))
}))),
"emojis": v.optional(v.record(v.string(), v.union([v.string()]))),
"channelId": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" }))),
"channel": v.optional(v.nullable(resultObject({
	"id": v.string(),
	"name": v.string(),
	"color": v.string(),
	"isSensitive": v.boolean(),
	"allowRenoteToExternal": v.boolean(),
	"userId": v.nullable(v.string())
}))),
"localOnly": v.optional(v.boolean()),
"reactionAcceptance": v.union([v.picklist(["likeOnly", "likeOnlyForRemote", "nonSensitiveOnly", "nonSensitiveOnlyForLocalLikeOnlyForRemote"]), v.null()]),
"reactionEmojis": v.record(v.string(), v.union([v.string()])),
"reactions": v.record(v.string(), v.union([v.number()])),
"reactionCount": v.number(),
"renoteCount": v.number(),
"repliesCount": v.number(),
"uri": v.optional(v.string()),
"url": v.optional(v.string()),
"reactionAndUserPairCache": v.optional(v.array(v.string())),
"clippedCount": v.optional(v.number()),
"hasPoll": v.optional(v.boolean()),
"myReaction": v.optional(v.nullable(v.string()))
});
export type PackedNote = v.InferOutput<typeof noteBaseSchema> & { reply?: PackedNote | null | undefined; renote?: PackedNote | null | undefined };
export const packedNoteSchema: v.GenericSchema<PackedNote, PackedNote> = resultObject({
...noteBaseSchema.entries,
"reply": v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
"renote": v.optional(v.nullable(v.lazy(() => packedNoteSchema)))
});
export const packedNoteDraftSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"text": v.nullable(v.string()),
	"cw": v.nullable(v.string()),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user": v.lazy(() => __ref_UserLite),
	"replyId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"renoteId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"reply": v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	"renote": v.optional(v.nullable(v.lazy(() => packedNoteSchema))),
	"visibility": v.picklist(["public", "home", "followers", "specified"]),
	"visibleUserIds": v.array(v.pipe(v.string(), v.metadata({ "format": "id" }))),
	"fileIds": v.array(v.pipe(v.string(), v.metadata({ "format": "id" }))),
	"files": v.optional(v.array(v.lazy(() => __ref_DriveFile))),
	"hashtag": v.nullable(v.string()),
	"poll": v.nullable(resultObject({
	"expiresAt": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" }))),
	"expiredAfter": v.optional(v.nullable(v.number())),
	"multiple": v.boolean(),
	"choices": v.array(v.string())
})),
	"channelId": v.pipe(v.nullable(v.string()), v.metadata({ "format": "id" })),
	"channel": v.optional(v.nullable(resultObject({
	"id": v.string(),
	"name": v.string(),
	"color": v.string(),
	"isSensitive": v.boolean(),
	"allowRenoteToExternal": v.boolean(),
	"userId": v.nullable(v.string())
}))),
	"localOnly": v.boolean(),
	"reactionAcceptance": v.union([v.picklist(["likeOnly", "likeOnlyForRemote", "nonSensitiveOnly", "nonSensitiveOnlyForLocalLikeOnlyForRemote"]), v.null()]),
	"scheduledAt": v.nullable(v.number()),
	"isActuallyScheduled": v.boolean()
});
export const packedNoteReactionSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"user": v.lazy(() => __ref_UserLite),
	"type": v.string()
});
export const packedNoteReactionWithNoteSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"user": v.lazy(() => __ref_UserLite),
	"type": v.string(),
	"note": v.lazy(() => packedNoteSchema)
});
