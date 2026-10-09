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
export const registryType = v.picklist(['null', 'array', 'number', 'string', 'boolean', 'object']);
export type RegistryValueType = v.InferOutput<typeof registryType>;

/** Key metadata is an object whose dynamic entries have a finite set of wire types. */
export const registryKeyTypes: v.GenericSchema<Record<string, RegistryValueType>> = v.lazy(input => {
	if (input !== null && typeof input === 'object') {
		if (Array.isArray(input)) return v.never();
		const prototype = Object.getPrototypeOf(input);
		if (prototype !== Object.prototype && prototype !== null) return v.never();
	}
	const shape = v.record(v.string(), registryType);
	if (input === undefined) return shape;
	if (input === null || typeof input !== 'object') return v.never();
	const entries = Object.keys(input).map(key => [key, Object.getOwnPropertyDescriptor(input, key)?.value] as const);
	if (entries.some(([, value]) => !v.safeParse(registryType, value).success)) return v.never();
	return v.pipe(shape, v.transform(() => Object.fromEntries(entries.map(([key, value]) => [key, v.parse(registryType, value)]))));
});
