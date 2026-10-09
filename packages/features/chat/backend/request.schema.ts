/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
export { objectInput } from '../../api/backend/transport/input.schema.js';
export { jsonString } from '../../api/backend/transport/string.schema.js';
export const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));
export function readErrorId(error: unknown): unknown {
	return error !== null && typeof error === 'object' && 'id' in error ? error.id : undefined;
}
