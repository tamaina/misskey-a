/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { getJsonStringLegacySchema } from './index.js';
import { getJsonObjectSchemaRegistration } from './json-object.js';

interface JsonObjectSchema extends v.GenericSchema {
	readonly entries: v.ObjectEntries;
	readonly pipe: readonly unknown[];
}

export interface RequireWhenAllNullishRegistration {
	readonly base: JsonObjectSchema;
	readonly guard: v.GenericSchema;
	readonly parser: v.GenericTransformation;
	readonly dependencies: readonly string[];
	readonly key: string;
	readonly schema: v.GenericSchema<string, string>;
}

const registrations = new WeakMap<object, RequireWhenAllNullishRegistration>();

/** Conditional checks run after native defaults; keep these outer fields default-free. */
function assertNoOuterDefaults(value: object, seen = new Set<object>()): void {
	if (seen.has(value)) return;
	seen.add(value);
	if ('type' in value && value.type === 'lazy') {
		throw new Error('Nullish conditional fields cannot use outer lazy schemas');
	}
	if ('default' in value && value.default !== undefined) {
		throw new Error('Nullish conditional fields cannot have outer defaults');
	}
	if ('type' in value && value.type === 'metadata' && 'metadata' in value
		&& value.metadata !== null && typeof value.metadata === 'object'
		&& Object.prototype.hasOwnProperty.call(value.metadata, 'default')) {
		throw new Error('Nullish conditional fields cannot have outer defaults');
	}
	if ('wrapped' in value && value.wrapped !== null && typeof value.wrapped === 'object') {
		assertNoOuterDefaults(value.wrapped, seen);
	}
	for (const key of ['pipe', 'options']) {
		const children = Reflect.get(value, key);
		if (Array.isArray(children)) for (const item of children) if (item !== null && typeof item === 'object') assertNoOuterDefaults(item, seen);
	}
}

/** Freeze only the outer boundary that determines condition/default ordering. */
function freezeOuterBoundary(value: object, seen = new Set<object>()): void {
	if (seen.has(value)) return;
	seen.add(value);
	if ('wrapped' in value && value.wrapped !== null && typeof value.wrapped === 'object') freezeOuterBoundary(value.wrapped, seen);
	for (const key of ['pipe', 'options']) {
		const children = Reflect.get(value, key);
		if (!Array.isArray(children)) continue;
		for (const item of children) if (item !== null && typeof item === 'object') freezeOuterBoundary(item, seen);
		Object.freeze(children);
	}
	if ('metadata' in value && value.metadata !== null && typeof value.metadata === 'object') Object.freeze(value.metadata);
	Object.freeze(value);
}

/** Require one canonical JSON string when every named content dependency is nullish. */
export function requireWhenAllNullish<const Base extends JsonObjectSchema, const Key extends keyof Base['entries'] & string>(
	base: Base,
	options: {
		readonly dependencies: readonly (keyof Base['entries'] & string)[];
		readonly key: Key;
		readonly schema: v.GenericSchema<string, string>;
	},
) {
	const object = getJsonObjectSchemaRegistration(base);
	if (object === undefined || base.pipe.length !== 2 || base.pipe[0] !== object.guard || base.pipe[1] !== object.parser
		|| !Object.isFrozen(base) || !Object.isFrozen(base.pipe)
		|| !('entries' in object.base) || base.entries !== object.base.entries) {
		throw new Error('Nullish conditional validation requires its original JSON-object base');
	}
	const { key, schema } = options;
	const dependencies = Object.freeze([...options.dependencies]);
	if (dependencies.length === 0 || new Set(dependencies).size !== dependencies.length
		|| dependencies.some(dependency => dependency === key || !Object.prototype.hasOwnProperty.call(base.entries, dependency))
		|| !Object.prototype.hasOwnProperty.call(base.entries, key)) {
		throw new Error('Nullish conditional validation requires distinct declared dependency and target keys');
	}
	if (getJsonStringLegacySchema(schema) === undefined) {
		throw new Error('Nullish conditional targets require a registered canonical JSON string');
	}
	for (const field of [...dependencies, key]) assertNoOuterDefaults(base.entries[field]);
	for (const field of [...dependencies, key]) freezeOuterBoundary(base.entries[field]);
	Object.freeze(schema);
	const action = Object.freeze(v.check<v.InferOutput<Base>, string>(value => {
		if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
		return dependencies.some(dependency => Reflect.get(value, dependency) != null)
			|| v.is(schema, Reflect.get(value, key));
	}, 'Expected text when all content dependencies are nullish'));
	registrations.set(action, Object.freeze({ base, guard: object.guard, parser: object.parser, dependencies, key, schema }));
	return action;
}

/** Recognize only this factory's exact frozen public validation action. */
export function getRequireWhenAllNullishRegistration(action: object): RequireWhenAllNullishRegistration | undefined {
	return registrations.get(action);
}
