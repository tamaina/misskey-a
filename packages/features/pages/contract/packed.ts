/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import { packedPageBlockSchema } from './page-block.js';
export { packedPageBlockSchema } from './page-block.js';
export type { PackedPageBlock } from './page-block.js';
import {
	packedDriveFileSchema as __ref_DriveFile
} from '../../drive/contract/packed.js';
import {
	packedUserLiteSchema as __ref_UserLite
} from '../../users/contract/packed.js';

export const packedPageSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"updatedAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"user": v.lazy(() => __ref_UserLite),
	// Stored pages may also contain historical or extension-defined opaque blocks.
	"content": v.array(v.union([v.lazy(() => packedPageBlockSchema), resultObject({})])),
	"variables": v.array(resultObject({})),
	"title": v.string(),
	"name": v.string(),
	"summary": v.nullable(v.string()),
	"hideTitleWhenPinned": v.boolean(),
	"alignCenter": v.boolean(),
	"font": v.picklist(["serif", "sans-serif"]),
	"script": v.string(),
	"eyeCatchingImageId": v.nullable(v.string()),
	"eyeCatchingImage": v.nullable(v.lazy(() => __ref_DriveFile)),
	"attachedFiles": v.array(v.lazy(() => __ref_DriveFile)),
	"likedCount": v.number(),
	"isLiked": v.optional(v.boolean())
});
