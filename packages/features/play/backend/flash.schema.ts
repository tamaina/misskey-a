/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { toPackedUserLite, packedUserLiteSchema as __ref_UserLite } from '../../users/backend/user.schema.js';

export const packedFlashSchema = v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user": v.lazy(() => __ref_UserLite),
	"title": v.string(),
	"summary": v.string(),
	"script": v.string(),
	"visibility": v.picklist(["private", "public"]),
	"likedCount": v.pipe(v.number(), v.finite()),
	"isLiked": v.optional(v.boolean())
});

export type PackedFlash = v.InferOutput<typeof packedFlashSchema>;

export function toPackedFlash(flash: PackedFlash): PackedFlash {
	return { id: flash.id, createdAt: flash.createdAt, updatedAt: flash.updatedAt, userId: flash.userId,
		user: toPackedUserLite(flash.user), title: flash.title, summary: flash.summary, script: flash.script,
		visibility: flash.visibility, likedCount: flash.likedCount,
		...(flash.isLiked === undefined ? {} : { isLiked: flash.isLiked }) };
}
