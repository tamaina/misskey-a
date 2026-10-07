/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

export { uniqueStringArray } from './unique-string-array.js';

/** Preserve the legacy JSON-object request semantics, including extra fields. */
export const objectParams = v.custom<Record<string, unknown>>(
	value => value !== null && typeof value === 'object' && !Array.isArray(value),
	'Expected a JSON object',
);

/** The existing Misskey identifier format, shared by portable contracts and the legacy validator. */
export const misskeyIdPattern = /^[a-zA-Z0-9]+$/;
export const misskeyId = v.custom<string>(
	value => typeof value === 'string' && misskeyIdPattern.test(value),
	'Expected a Misskey identifier',
);

export interface JsonStringOptions {
	minLength?: number;
	maxLength?: number;
}

export interface JsonStringLegacySchema {
	readonly type: 'string';
	readonly minLength?: number;
	readonly maxLength?: number;
}

const jsonStringLegacySchemas = new WeakMap<object, JsonStringLegacySchema>();

/** String schema with JSON Schema's Unicode-code-point length semantics. */
export function jsonString(options: JsonStringOptions = {}) {
	// Capture primitive values now so later caller mutations can't change validation or projection.
	const { minLength, maxLength } = options;
	const schema = v.custom<string>(
		value => {
			if (typeof value !== 'string') return false;

			let length = 0;
			for (const _codePoint of value) {
				length++;
				if (maxLength !== undefined && length > maxLength) return false;
			}

			return (minLength === undefined || length >= minLength)
				&& (maxLength === undefined || length <= maxLength);
		},
		'Expected a string with the configured length',
	);

	jsonStringLegacySchemas.set(schema, Object.freeze({
		type: 'string',
		...(minLength === undefined ? {} : { minLength }),
		...(maxLength === undefined ? {} : { maxLength }),
	}));
	return schema;
}

/** Return the legacy JSON Schema shape for a jsonString schema, if registered. */
export function getJsonStringLegacySchema(schema: object): JsonStringLegacySchema | undefined {
	return jsonStringLegacySchemas.get(schema);
}

/** Portable error description; the transport supplies the concrete error class. */
export interface ApiErrorDefinition {
	message: string;
	code: string;
	id: string;
	kind?: 'client' | 'server' | 'permission';
	httpStatusCode?: number;
}
