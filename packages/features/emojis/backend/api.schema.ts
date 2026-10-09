/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';

const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const emojiSimpleResult = v.strictObject({
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	url: v.string(),
	localOnly: v.optional(v.boolean()),
	isSensitive: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
});

export const emojiDetailedResult = v.strictObject({
	id: v.string(),
	aliases: v.array(v.string()),
	name: v.string(),
	category: v.nullable(v.string()),
	host: v.pipe(v.nullable(v.string()), v.metadata({ description: 'The local host is represented with `null`.' })),
	url: v.string(),
	license: v.nullable(v.string()),
	isSensitive: v.boolean(),
	localOnly: v.boolean(),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.array(v.string()),
});

export const emojiInput = objectInput({ name: v.string() });
export const emojisInput = v.optional(objectInput({}), {});
export const emojisResult = v.strictObject({ emojis: v.array(emojiSimpleResult) });
export const packedEmojiDetailedAdminSchema = v.strictObject({
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
	"roleIdsThatCanBeUsedThisEmojiAsReaction": v.array(v.strictObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"name": v.string()
}))
});

export const packedAdminEmojiAddInput = objectInput({
	"name": v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$"))),
	"fileId": misskeyId,
	"category": v.exactOptional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Use `null` to reset the category." }))),
	"aliases": v.exactOptional(v.array(v.string())),
	"license": v.exactOptional(v.nullable(v.string())),
	"isSensitive": v.exactOptional(v.boolean()),
	"localOnly": v.exactOptional(v.boolean()),
	"roleIdsThatCanBeUsedThisEmojiAsReaction": v.exactOptional(v.array(v.string())),
});

export const packedAdminEmojiListInput = objectInput({
	"query": v.optional(v.nullable(v.string()), null),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const packedAdminEmojiListRemoteInput = objectInput({
	"query": v.optional(v.nullable(v.string()), null),
	"host": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "Use `null` to represent the local host." })), null),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});

export const voidAdminEmojiDeleteInput = objectInput({
	"id": misskeyId,
});

export const voidAdminEmojiDeleteBulkInput = objectInput({
	"ids": v.array(misskeyId),
});

export const voidAdminEmojiImportZipInput = objectInput({
	"fileId": misskeyId,
});

export const voidExportCustomEmojisInput = objectInput({});
export const inlineAdminEmojiCopyInput = objectInput({
	"emojiId": misskeyId,
});

const ids = v.array(misskeyId);
const aliases = v.array(v.string());
export const emojiAliasesBulkInput = objectInput({ ids, aliases });
export const emojiCategoryBulkInput = objectInput({ ids, category: v.exactOptional(v.nullable(v.string())) });
export const emojiLicenseBulkInput = objectInput({ ids, license: v.exactOptional(v.nullable(v.string())) });
const updateCommon = {
	fileId: v.optional(misskeyId), category: v.optional(v.nullable(v.string())), aliases: v.optional(aliases),
	license: v.optional(v.nullable(v.string())), isSensitive: v.optional(v.boolean()), localOnly: v.optional(v.boolean()),
	roleIdsThatCanBeUsedThisEmojiAsReaction: v.optional(v.array(v.string())),
};
// The ID selector accepts a rename; the name-only selector validates the emoji name.
export const emojiUpdateInput = v.union([
	objectInput({ id: misskeyId, name: v.optional(v.string()), ...updateCommon }),
	objectInput({ name: v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/)), ...updateCommon }),
]);
export const fetchEmojisHostTypes = [
	'local',
	'remote',
	'all',
] as const;

export const fetchEmojisSortKeys = [
	'+id',
	'-id',
	'+updatedAt',
	'-updatedAt',
	'+name',
	'-name',
	'+host',
	'-host',
	'+uri',
	'-uri',
	'+publicUrl',
	'-publicUrl',
	'+type',
	'-type',
	'+aliases',
	'-aliases',
	'+category',
	'-category',
	'+license',
	'-license',
	'+isSensitive',
	'-isSensitive',
	'+localOnly',
	'-localOnly',
	'+roleIdsThatCanBeUsedThisEmojiAsReaction',
	'-roleIdsThatCanBeUsedThisEmojiAsReaction',
] as const;

export const portableV2AdminEmojiListInput = objectInput({
	"query": v.exactOptional(v.pipe(v.nullable(objectInput({
		"updatedAtFrom": v.exactOptional(v.string()),
		"updatedAtTo": v.exactOptional(v.string()),
		"name": v.exactOptional(v.string()),
		"host": v.exactOptional(v.string()),
		"uri": v.exactOptional(v.string()),
		"publicUrl": v.exactOptional(v.string()),
		"originalUrl": v.exactOptional(v.string()),
		"type": v.exactOptional(v.string()),
		"aliases": v.exactOptional(v.string()),
		"category": v.exactOptional(v.string()),
		"license": v.exactOptional(v.string()),
		"isSensitive": v.exactOptional(v.boolean()),
		"localOnly": v.exactOptional(v.boolean()),
		"hostType": v.optional(v.picklist(fetchEmojisHostTypes), "all"),
		"roleIds": v.exactOptional(v.array(misskeyId)),
	})), v.metadata({ "required": undefined }))),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	"page": v.exactOptional(v.pipe(v.number(), v.integer())),
	"sortKeys": v.optional(v.array(v.picklist(fetchEmojisSortKeys)), ["-id"]),
});

export const v2EmojiListOutput = v.strictObject({ emojis: v.array(packedEmojiDetailedAdminSchema), count: v.pipe(v.number(), v.integer()), allCount: v.pipe(v.number(), v.integer()), allPages: v.pipe(v.number(), v.integer()) });
