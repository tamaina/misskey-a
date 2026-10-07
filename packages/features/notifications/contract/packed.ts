/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import {
	packedChatRoomInvitationSchema as __ref_ChatRoomInvitation
} from '../../chat/contract/packed.js';
import {
	packedNoteSchema as __ref_Note,
	packedNoteDraftSchema as __ref_NoteDraft
} from '../../notes/contract/packed.js';
import {
	packedRoleSchema as __ref_Role
} from '../../roles/contract/packed.js';
import {
	packedAchievementNameSchema as __ref_AchievementName,
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedNotificationSchema = v.variant("type", [v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["note"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["mention"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reply"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["renote"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["quote"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reaction"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note),
	"reaction": v.string()
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["pollEnded"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["scheduledNotePosted"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	"note": v.lazy(() => __ref_Note)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["scheduledNotePostFailed"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	// Existing notifications may omit the draft; packing must not fetch new private data.
	"noteDraft": v.optional(v.lazy(() => __ref_NoteDraft))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["follow"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["receiveFollowRequest"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["followRequestAccepted"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"message": v.nullable(v.string())
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["roleAssigned"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	"role": v.lazy(() => __ref_Role)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["chatRoomInvitationReceived"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"invitation": v.lazy(() => __ref_ChatRoomInvitation)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["achievementEarned"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	"achievement": v.lazy(() => __ref_AchievementName)
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["exportCompleted"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	"exportedEntity": v.picklist(["antenna", "blocking", "clip", "customEmoji", "favorite", "following", "muting", "note", "userList"]),
	"fileId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["login"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never())
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["createToken"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never())
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["app"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never()),
	"body": v.string(),
	"header": v.nullable(v.string()),
	"icon": v.nullable(v.string())
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reaction:grouped"]),
	"note": v.lazy(() => __ref_Note),
	"reactions": v.array(v.strictObject({
	"user": v.lazy(() => __ref_UserLite),
	"reaction": v.string()
}))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["renote:grouped"]),
	"note": v.lazy(() => __ref_Note),
	"users": v.array(v.lazy(() => __ref_UserLite))
}), v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["test"]),
	// packedCommon emits this enumerable key as undefined; JSON must omit it.
	"userId": v.optional(v.never())
})]);
