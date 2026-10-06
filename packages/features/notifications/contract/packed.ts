/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
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

export const packedNotificationSchema = v.variant("type", [resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["note"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["mention"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reply"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["renote"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["quote"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reaction"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note),
	"reaction": v.string()
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["pollEnded"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["scheduledNotePosted"]),
	"note": v.lazy(() => __ref_Note)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["scheduledNotePostFailed"]),
	// Existing notifications may omit the draft; packing must not fetch new private data.
	"noteDraft": v.optional(v.lazy(() => __ref_NoteDraft))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["follow"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["receiveFollowRequest"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["followRequestAccepted"]),
	"user": v.lazy(() => __ref_UserLite),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"message": v.nullable(v.string())
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["roleAssigned"]),
	"role": v.lazy(() => __ref_Role)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["chatRoomInvitationReceived"]),
	"invitation": v.lazy(() => __ref_ChatRoomInvitation)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["achievementEarned"]),
	"achievement": v.lazy(() => __ref_AchievementName)
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["exportCompleted"]),
	"exportedEntity": v.picklist(["antenna", "blocking", "clip", "customEmoji", "favorite", "following", "muting", "note", "userList"]),
	"fileId": v.pipe(v.string(), v.metadata({ "format": "id" }))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["login"])
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["createToken"])
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["app"]),
	"body": v.string(),
	"header": v.nullable(v.string()),
	"icon": v.nullable(v.string())
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["reaction:grouped"]),
	"note": v.lazy(() => __ref_Note),
	"reactions": v.array(resultObject({
	"user": v.lazy(() => __ref_UserLite),
	"reaction": v.string()
}))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["renote:grouped"]),
	"note": v.lazy(() => __ref_Note),
	"users": v.array(v.lazy(() => __ref_UserLite))
}), resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"type": v.picklist(["test"])
})]);
