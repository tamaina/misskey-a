/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { resultObject } from '../../api/contract/result-object.js';

const pageTextBlockSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["text"]),
	"text": v.string()
});
const pageImageBlockSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["image"]),
	"fileId": v.nullable(v.string())
});
const pageNoteBlockSchema = resultObject({
	"id": v.string(),
	"type": v.picklist(["note"]),
	"detailed": v.boolean(),
	"note": v.nullable(v.string())
});
const pageSectionBaseSchema = resultObject({ "id": v.string(),
"type": v.picklist(["section"]),
"title": v.string() });
// Deprecated dynamic blocks still exist in stored pages and must round-trip.
const legacyPageBlockBaseSchema = resultObject({
	id: v.string(),
	type: v.picklist(['button', 'if', 'textarea', 'post', 'canvas', 'numberInput', 'textInput', 'switch', 'radioButton', 'counter', 'input']),
});
export type PackedPageBlock =
	| v.InferOutput<typeof pageTextBlockSchema | typeof pageImageBlockSchema | typeof pageNoteBlockSchema>
	| (v.InferOutput<typeof pageSectionBaseSchema> & { children: (PackedPageBlock | Record<string, unknown>)[] })
	| (v.InferOutput<typeof legacyPageBlockBaseSchema> & { children?: (PackedPageBlock | Record<string, unknown>)[] | undefined });
export const packedPageBlockSchema: v.GenericSchema<PackedPageBlock, PackedPageBlock> = v.variant('type', [
	pageTextBlockSchema,
	resultObject({ ...pageSectionBaseSchema.entries, children: v.array(v.union([v.lazy(() => packedPageBlockSchema), v.looseObject({})])) }),
	pageImageBlockSchema,
	pageNoteBlockSchema,
	resultObject({ ...legacyPageBlockBaseSchema.entries, children: v.optional(v.array(v.union([v.lazy(() => packedPageBlockSchema), v.looseObject({})]))) }),
]);
