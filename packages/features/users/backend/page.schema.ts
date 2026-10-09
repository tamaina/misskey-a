/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import {
	packedDriveFileSchema as __ref_DriveFile,
} from '../../notes/backend/drive.schema.js';
import { packedJsonObjectSchema } from './json-value.schema.js';
import {
	packedUserLiteSchema as __ref_UserLite,
} from './user.schema.js';

export const packedPageSchema = v.strictObject({
	'id': v.pipe(v.string(), v.metadata({ 'format': 'id', 'example': 'xxxxxxxxxx' })),
	'createdAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'updatedAt': v.pipe(v.string(), v.metadata({ 'format': 'date-time' })),
	'userId': v.pipe(v.string(), v.metadata({ 'format': 'id' })),
	'user': v.lazy(() => __ref_UserLite),
	// Page blocks and variables are persisted user-authored JSON programs.
	// Their extension keys are business data; every nested value must be JSON-safe.
	'content': v.array(packedJsonObjectSchema),
	'variables': v.array(packedJsonObjectSchema),
	'title': v.string(),
	'name': v.string(),
	'summary': v.nullable(v.string()),
	'hideTitleWhenPinned': v.boolean(),
	'alignCenter': v.boolean(),
	'font': v.picklist(['serif', 'sans-serif']),
	'script': v.string(),
	'eyeCatchingImageId': v.nullable(v.string()),
	'eyeCatchingImage': v.nullable(v.lazy(() => __ref_DriveFile)),
	'attachedFiles': v.array(v.lazy(() => __ref_DriveFile)),
	'likedCount': v.number(),
	'isLiked': v.optional(v.boolean()),
});
