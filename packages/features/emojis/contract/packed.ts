/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';
import { emojiSimpleResult, emojiDetailedResult } from './index.js';

export const packedEmojiDetailedSchema = emojiDetailedResult;
export const packedEmojiDetailedAdminSchema = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "id" })),
	"updatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"name": v.string(),
	"host": v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })),
	"publicUrl": v.string(),
	"originalUrl": v.string(),
	"uri": v.nullable(v.string()),
	"type": v.nullable(v.string()),
	"aliases": v.array(v.pipe(v.string(), v.metadata({ "format": "id" }))),
	"category": v.nullable(v.string()),
	"license": v.nullable(v.string()),
	"localOnly": v.boolean(),
	"isSensitive": v.boolean(),
	"roleIdsThatCanBeUsedThisEmojiAsReaction": v.array(resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"name": v.string()
}))
});
export const packedEmojiSimpleSchema = emojiSimpleResult;
