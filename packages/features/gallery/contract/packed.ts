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

export const packedGalleryPostSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user": v.lazy(() => __ref_UserLite),
	"title": v.string(),
	"description": v.nullable(v.string()),
	"fileIds": v.optional(v.array(v.pipe(v.string(), v.metadata({ "format": "id" })))),
	"files": v.optional(v.array(v.lazy(() => __ref_DriveFile))),
	"tags": v.optional(v.array(v.string())),
	"isSensitive": v.boolean(),
	"likedCount": v.number(),
	"isLiked": v.optional(v.boolean())
});
