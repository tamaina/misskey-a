/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** Persisted JSON business data, recursively validated rather than an opaque object escape. */
export type PackedJsonValue = null | boolean | number | string | PackedJsonValue[] | { [key: string]: PackedJsonValue };

function isNonJsonObject(input: unknown): boolean {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
	const prototype = Object.getPrototypeOf(input);
	return prototype !== Object.prototype && prototype !== null;
}

/** Validate the original tree, including record-parser reserved keys, before recursive parsing. */
function isJsonTree(input: unknown, active: WeakSet<object> = new WeakSet()): boolean {
	if (input === null || typeof input === 'string' || typeof input === 'boolean') return true;
	if (typeof input === 'number') return Number.isFinite(input);
	if (typeof input !== 'object' || isNonJsonObject(input) || active.has(input)) return false;
	active.add(input);
	const valid = Array.isArray(input)
		? Array.from(input).every(value => isJsonTree(value, active))
		: Object.keys(input).every(key => isJsonTree(Object.getOwnPropertyDescriptor(input, key)?.value, active));
	active.delete(input);
	return valid;
}

function jsonValueShape() {
	return v.union([
		v.null(), v.boolean(), v.pipe(v.number(), v.finite()), v.string(),
		v.array(packedJsonValueSchema), v.record(v.string(), packedJsonValueSchema),
	]);
}

// Projection invokes lazy getters with undefined and receives an explicit recursive JSON shape.
// Runtime prevalidation rejects cycles/native values before record can recurse or omit reserved keys.
// The transform restores every original JSON business key, including __proto__/constructor/prototype.
export const packedJsonValueSchema: v.GenericSchema<PackedJsonValue> = v.lazy(input => {
	if (input === undefined) return jsonValueShape();
	if (!isJsonTree(input)) return v.never();
	return v.pipe(jsonValueShape(), v.transform(() => toPackedJsonValue(input)));
});
export const packedJsonObjectSchema: v.GenericSchema<{ [key: string]: PackedJsonValue }> = v.lazy(input => {
	const shape = v.record(v.string(), packedJsonValueSchema);
	if (input === undefined) return shape;
	if (input === null || typeof input !== 'object' || Array.isArray(input) || !isJsonTree(input)) return v.never();
	return v.pipe(shape, v.transform(() => toPackedJsonObject(input)));
});

/** Explicit recursive wrapper types keep generated declarations compact while
 * preserving the same finite JSON validators and optional/null runtime behavior. */
export const packedOptionalJsonValueSchema: v.GenericSchema<PackedJsonValue | undefined> = v.optional(packedJsonValueSchema);
export const packedOptionalJsonObjectSchema: v.GenericSchema<{ [key: string]: PackedJsonValue } | undefined> = v.optional(packedJsonObjectSchema);
export const packedNullableJsonValueSchema: v.GenericSchema<PackedJsonValue | null> = v.nullable(packedJsonValueSchema);

/** Preserve ordinary record wire normalization without running a schema validator. */
export function toPackedRecord<Value>(input: Readonly<Record<string, Value>>): Record<string, Value> {
	return Object.fromEntries(Object.entries(input).filter(([key]) => key !== '__proto__' && key !== 'prototype' && key !== 'constructor'));
}

/** Materialize genuine stored JSON; Object.fromEntries preserves reserved names as own data keys. */
export function toPackedJsonValue(input: unknown): PackedJsonValue {
	if (!isJsonTree(input)) throw new TypeError('Stored JSON must contain only acyclic JSON values');
	if (input === null || typeof input === 'string' || typeof input === 'boolean') return input;
	if (typeof input === 'number') return input;
	if (Array.isArray(input)) return input.map((value: unknown) => toPackedJsonValue(value));
	return toPackedJsonObject(input);
}

export function toPackedJsonObject(input: unknown): { [key: string]: PackedJsonValue } {
	if (input === null || typeof input !== 'object' || Array.isArray(input) || !isJsonTree(input)) {
		throw new TypeError('Stored JSON must contain only acyclic JSON values');
	}
	return Object.fromEntries(Object.keys(input).map((key): [string, PackedJsonValue] => [key, toPackedJsonValue(Object.getOwnPropertyDescriptor(input, key)?.value)]));
}

/** Preserve original finite JSON extensions, including keys skipped by object parsers. */
export function businessJsonObjectWithRest<const Entries extends v.ObjectEntries, const Rest extends v.GenericSchema>(entries: Entries, rest: Rest) {
	const fields = v.objectWithRest(entries, rest);
	return v.lazy(input => {
		if (input === undefined) return fields;
		if (input === null || typeof input !== 'object' || Array.isArray(input) || isNonJsonObject(input)) return v.never();
		for (const key of Object.keys(input)) {
			const value = Object.getOwnPropertyDescriptor(input, key)?.value;
			// Explicit undefined is supported only for declared optional fields; their schema verifies optionality.
			if (Object.hasOwn(entries, key) && value === undefined) continue;
			if (!isJsonTree(value)) return v.never();
			if (!Object.hasOwn(entries, key) && !v.safeParse(rest, value).success) return v.never();
		}
		return v.pipe(fields, v.transform(parsed => {
			const extensions: { [key: string]: v.InferOutput<Rest> } = {};
			for (const key of Object.keys(input)) {
				if (Object.hasOwn(entries, key)) continue;
				Object.defineProperty(extensions, key, {
					value: v.parse(rest, Object.getOwnPropertyDescriptor(input, key)?.value),
					enumerable: true, configurable: true, writable: true,
				});
			}
			return { ...parsed, ...extensions };
		}));
	});
}
