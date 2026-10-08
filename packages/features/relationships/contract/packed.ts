/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import {
	packedUserDetailedSchema,
	packedUserDetailedNotMeSchema as __ref_UserDetailedNotMe
} from '../../users/contract/packed.js';

export const packedBlockingSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"blockeeId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"blockee": v.lazy(() => __ref_UserDetailedNotMe)
});
export const packedFollowingSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"followeeId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"followerId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"followee": v.optional(packedUserDetailedSchema),
	"follower": v.optional(packedUserDetailedSchema)
});
export const packedMutingSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"expiresAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"muteeId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"mutee": v.lazy(() => __ref_UserDetailedNotMe)
});
export const packedRenoteMutingSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"muteeId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"mutee": v.lazy(() => __ref_UserDetailedNotMe)
});
export const packedUserListSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"name": v.string(),
	"userIds": v.optional(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
	"isPublic": v.boolean()
});
