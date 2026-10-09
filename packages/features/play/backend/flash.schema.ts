/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/backend/user.schema.js';

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
