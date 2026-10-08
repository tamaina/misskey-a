/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';

/** JSON wire values, excluding native Date, undefined and non-finite numbers. */
export type JsonValue = null | string | boolean | number | JsonValue[] | JsonObject;
export interface JsonObject { [key: string]: JsonValue; }

/** Terminate validation of cyclic native containers before entering recursive schemas. */
function isAcyclic(value: unknown): boolean {
	const active = new WeakSet<object>();
	const pending: { value: unknown; leave: boolean }[] = [{ value, leave: false }];
	while (pending.length > 0) {
		const frame = pending.pop()!;
		if (frame.value === null || typeof frame.value !== 'object') continue;
		if (frame.leave) { active.delete(frame.value); continue; }
		if (active.has(frame.value)) return false;
		active.add(frame.value);
		pending.push({ value: frame.value, leave: true });
		for (const child of Object.values(frame.value)) pending.push({ value: child, leave: false });
	}
	return true;
}

const recursiveValue = Object.freeze(v.lazy(() => jsonValueSchema));
const objectProjection = Object.freeze(v.record(Object.freeze(v.string()), recursiveValue));
// Stock record parsing skips prototype-related JSON keys and accepts native objects.
// Validate every own string key through the same recursive schema without rewriting it.
const objectValue = Object.freeze(v.custom<JsonObject>(value => {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return false;
	if (Object.getOwnPropertySymbols(value).length > 0) return false;
	return Object.keys(value).every(key => v.is(jsonValueSchema, Reflect.get(value, key)));
}, 'Expected a JSON object'));

const finiteNumber = Object.freeze(v.pipe(v.number(), v.minValue(-Number.MAX_VALUE), v.maxValue(Number.MAX_VALUE)));
for (const item of finiteNumber.pipe) Object.freeze(item);
Object.freeze(finiteNumber.pipe);
const valueUnion = Object.freeze(v.union([
	Object.freeze(v.null()), Object.freeze(v.string()), Object.freeze(v.boolean()), finiteNumber,
	Object.freeze(v.array(recursiveValue)), objectValue,
]));
Object.freeze(valueUnion.options);
const acyclic = Object.freeze(v.custom<JsonValue>(isAcyclic, 'Expected acyclic JSON values'));
const canonical = v.pipe(acyclic, valueUnion);
Object.freeze(canonical.pipe);
export const jsonValueSchema: v.GenericSchema<JsonValue, JsonValue> = Object.freeze(canonical);

/** Only these exact owned instances may use the shared output component. */
export function getJsonValueReference(schema: object): 'JsonValue' | undefined {
	return schema === jsonValueSchema || schema === valueUnion ? 'JsonValue' : undefined;
}

/** Public record layout for this exact object validator; no replacement runtime parser. */
export function getJsonValueObjectProjection(schema: object): typeof objectProjection | undefined {
	return schema === objectValue ? objectProjection : undefined;
}
