/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Registry values share the portable recursive JSON DTO used by persisted user data. */
export type { PackedJsonValue as RegistryJsonValue } from '../../../../../users/backend/json-value.schema.js';
export { packedJsonValueSchema as registryJsonValue, packedJsonObjectSchema as registryJsonObject } from '../../../../../users/backend/json-value.schema.js';

export const registryScope = v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/))), []);
export const registryDomain = v.exactOptional(v.nullable(v.string()));
