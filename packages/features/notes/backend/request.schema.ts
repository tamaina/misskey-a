/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
export { objectInput } from '../../api/backend/transport/input.schema.js';
export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export const jsonNumber = v.pipe(v.number(), v.finite());
export const MAX_NOTE_TEXT_LENGTH = 3000;

export { jsonString } from '../../api/backend/transport/string.schema.js';

export function uniqueStringArray<const Schema extends v.GenericSchema<string, string>>(schema: Schema) {
	return v.pipe(v.array(schema), v.check(value => new Set(value).size === value.length), v.metadata({ uniqueItems: true }));
}

export function readErrorId(error: unknown): unknown {
	return error !== null && typeof error === 'object' && 'id' in error ? error.id : undefined;
}
