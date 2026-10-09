/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { packedJsonObjectSchema, type PackedJsonValue } from '../../users/backend/json-value.schema.js';

/** Request headers are persisted JSON business data, including reserved names. */
export const requestHeadersSchema = packedJsonObjectSchema;
export function toRequestHeaders(headers: Record<string, string | string[] | undefined> | null): Record<string, string | string[]> | null {
	if (headers === null) return null;
	const result: Record<string, string | string[]> = {};
	for (const key of Object.keys(headers)) {
		const value = headers[key];
		if (value !== undefined) Object.defineProperty(result, key, { value, enumerable: true, configurable: true, writable: true });
	}
	return result;
}

/** At least one valid selector is required; the inactive selector retains finite JSON. */
export type DriveFileShowSelector =
	| { fileId: string; url?: PackedJsonValue }
	| { fileId?: PackedJsonValue; url: string };
