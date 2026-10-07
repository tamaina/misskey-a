/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Object-only wire validation, deliberately not validation of any domain payload. */
export const opaqueObject = Object.freeze(v.custom<Record<string, unknown>>(
	value => value !== null && typeof value === 'object' && !Array.isArray(value),
	'Expected an opaque JSON object',
));

export function isOpaqueObject(schema: object): boolean {
	return schema === opaqueObject;
}

/** Detect copied guards without treating a structural lookalike as registered. */
export function hasOpaqueObjectCheck(schema: object): boolean {
	return 'check' in schema && schema.check === opaqueObject.check;
}
