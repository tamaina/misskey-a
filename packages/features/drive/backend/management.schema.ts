/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { objectInput } from '../../api/backend/transport/input.schema.js';
import { misskeyId } from '../../users/backend/users.input.schema.js';
import { packedJsonValueSchema, type PackedJsonValue } from '../../users/backend/json-value.schema.js';

/** Request headers are persisted JSON business data, including reserved names. */
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

/** Both file-show endpoints share selector validation and retain inactive finite JSON. */
export const driveFileShowSelectorSchema: v.GenericSchema<DriveFileShowSelector, DriveFileShowSelector> = v.union([
	objectInput({ fileId: misskeyId, url: v.exactOptional(packedJsonValueSchema) }),
	objectInput({ fileId: v.exactOptional(packedJsonValueSchema), url: v.string() }),
]);
