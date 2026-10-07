/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import {
	packedDriveFileSchema as __ref_DriveFile
} from '../../drive/contract/packed.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedChatMessageSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"fromUserId": v.string(),
	"fromUser": v.lazy(() => __ref_UserLite),
	"toUserId": v.optional(v.nullable(v.string())),
	"toUser": v.optional(v.nullable(v.lazy(() => __ref_UserLite))),
	"toRoomId": v.optional(v.nullable(v.string())),
	"toRoom": v.optional(v.nullable(v.lazy(() => packedChatRoomSchema))),
	"text": v.optional(v.nullable(v.string())),
	"fileId": v.optional(v.nullable(v.string())),
	"file": v.optional(v.nullable(v.lazy(() => __ref_DriveFile))),
	"isRead": v.optional(v.boolean()),
	"reactions": v.array(v.strictObject({
	"reaction": v.string(),
	"user": v.lazy(() => __ref_UserLite)
}))
});
export const packedChatMessageLiteSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"fromUserId": v.string(),
	"fromUser": v.optional(v.lazy(() => __ref_UserLite)),
	"toUserId": v.optional(v.nullable(v.string())),
	"toRoomId": v.optional(v.nullable(v.string())),
	"text": v.optional(v.nullable(v.string())),
	"fileId": v.optional(v.nullable(v.string())),
	"file": v.optional(v.nullable(v.lazy(() => __ref_DriveFile))),
	"reactions": v.array(v.strictObject({
	"reaction": v.string(),
	"user": v.optional(v.nullable(v.lazy(() => __ref_UserLite)))
}))
});
export const packedChatMessageLiteFor1on1Schema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"fromUserId": v.string(),
	"toUserId": v.string(),
	"text": v.optional(v.nullable(v.string())),
	"fileId": v.optional(v.nullable(v.string())),
	"file": v.optional(v.nullable(v.lazy(() => __ref_DriveFile))),
	"reactions": v.array(v.strictObject({
	"reaction": v.string()
}))
});
export const packedChatMessageLiteForRoomSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"fromUserId": v.string(),
	"fromUser": v.lazy(() => __ref_UserLite),
	"toRoomId": v.string(),
	"text": v.optional(v.nullable(v.string())),
	"fileId": v.optional(v.nullable(v.string())),
	"file": v.optional(v.nullable(v.lazy(() => __ref_DriveFile))),
	"reactions": v.array(v.strictObject({
	"reaction": v.string(),
	"user": v.lazy(() => __ref_UserLite)
}))
});
export const packedChatRoomSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"ownerId": v.string(),
	"owner": v.lazy(() => __ref_UserLite),
	"name": v.string(),
	"description": v.string(),
	"isMuted": v.optional(v.boolean()),
	"invitationExists": v.optional(v.boolean())
});
export const packedChatRoomInvitationSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"userId": v.string(),
	"user": v.lazy(() => __ref_UserLite),
	"roomId": v.string(),
	"room": v.lazy(() => packedChatRoomSchema)
});
export const packedChatRoomMembershipSchema = v.strictObject({
	"id": v.string(),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"userId": v.string(),
	"user": v.optional(v.lazy(() => __ref_UserLite)),
	"roomId": v.string(),
	"room": v.optional(v.lazy(() => packedChatRoomSchema))
});
