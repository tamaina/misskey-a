/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { businessJsonObjectWithRest, packedJsonObjectSchema, packedJsonValueSchema } from '../../users/backend/json-value.schema.js';

// Page programs retain stored extension keys, while known block fields remain typed.
// Nested programs also contain historical and extension-defined JSON blocks.
const text = businessJsonObjectWithRest({ id: v.string(), type: v.literal('text'), text: v.string() }, packedJsonValueSchema);
const image = businessJsonObjectWithRest({ id: v.string(), type: v.literal('image'), fileId: v.nullable(v.string()) }, packedJsonValueSchema);
const note = businessJsonObjectWithRest({ id: v.string(), type: v.literal('note'), detailed: v.boolean(), note: v.nullable(v.string()) }, packedJsonValueSchema);
const section = businessJsonObjectWithRest({ id: v.string(), type: v.literal('section'), title: v.string(), children: v.array(packedJsonObjectSchema) }, packedJsonValueSchema);
const legacy = businessJsonObjectWithRest({
	id: v.string(),
	type: v.picklist(['button', 'if', 'textarea', 'post', 'canvas', 'numberInput', 'textInput', 'switch', 'radioButton', 'counter', 'input']),
	children: v.optional(v.array(packedJsonObjectSchema)),
}, packedJsonValueSchema);

export const packedPageBlockSchema = v.union([text, section, image, note, legacy]);
export type PackedPageBlock = v.InferOutput<typeof packedPageBlockSchema>;
