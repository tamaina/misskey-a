/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { getJsonStringLegacySchema, misskeyId } from './index.js';
import { jsonNumber } from './json-number.js';
import { getJsonObjectSchemaRegistration } from './json-object.js';
import { getUniqueStringArrayBaseSchema, getUniqueStringArraySchemaRegistration } from './unique-string-array.js';

const annotationKeys = new Set([
	'title', 'description', 'example', 'examples', '$comment', 'deprecated',
	'readOnly', 'writeOnly', 'externalDocs',
]);
const annotationReferences = new Map<unknown, string>([
	[v.metadata, 'metadata'], [v.description, 'description'], [v.title, 'title'], [v.examples, 'examples'],
]);

/** Inspect public annotation boundaries only; never walk example values or caller data. */
export function assertSelectorCommonAnnotation(action: object): boolean {
	const type = Reflect.get(action, 'type');
	const reference = Reflect.get(action, 'reference');
	const expected = annotationReferences.get(reference);
	if (type !== 'metadata' && type !== 'description' && type !== 'title' && type !== 'examples' && expected === undefined) return false;
	if (Reflect.get(action, 'kind') !== 'metadata' || type !== expected) {
		throw new Error('Selector/common contracts cannot use disguised annotation actions');
	}
	if (type === 'metadata') {
		const annotations: unknown = Reflect.get(action, 'metadata');
		if (annotations === null || typeof annotations !== 'object' || Array.isArray(annotations)
			|| Object.keys(annotations).some(key => !annotationKeys.has(key))) {
			throw new Error('Selector/common contracts require annotation-only metadata');
		}
	}
	return true;
}

type FieldShape = { readonly scalar: 'string' | 'boolean' | 'number'; readonly dimensions: number; readonly nullable: boolean; readonly unique?: boolean };

/** Admit the selector/common routes' bounded nontransforming public Valibot subset. */
function admitField(schema: object, active = new Set<object>()): FieldShape {
	if (active.has(schema)) throw new Error('Selector/common fields cannot use cyclic schemas');
	active.add(schema);
	try {
		if (Reflect.get(schema, 'kind') !== 'schema' || Reflect.get(schema, 'async') !== false || 'fallback' in schema
			|| ('default' in schema && Reflect.get(schema, 'default') !== undefined)) {
			throw new Error('Selector/common fields require default-free synchronous schemas');
		}
		if ('pipe' in schema) {
			if (!Array.isArray(schema.pipe) || schema.pipe.length === 0) throw new Error('Selector/common fields require a valid public pipeline');
			const [base, ...actions] = schema.pipe;
			if (base === null || typeof base !== 'object') throw new Error('Selector/common fields require a schema base');
			const shape = admitField(base, active);
			let unique = false;
			for (const [index, action] of actions.entries()) {
				if (action === null || typeof action !== 'object' || 'pipe' in action) throw new Error('Selector/common fields cannot use nested action pipelines');
				if (assertSelectorCommonAnnotation(action)) continue;
				if (Reflect.get(action, 'kind') !== 'validation' || Reflect.get(action, 'async') !== false) throw new Error('Selector/common fields cannot transform values');
				const uniqueBase = getUniqueStringArrayBaseSchema(action);
				if (uniqueBase !== undefined) {
					const registration = getUniqueStringArraySchemaRegistration(schema);
					if (registration === undefined || !Object.is(registration.pipe, schema.pipe) || registration.array !== base
						|| uniqueBase !== base || registration.action !== action || index !== 0 || actions.length !== 1
						|| shape.scalar !== 'string' || shape.dimensions !== 1 || shape.nullable || shape.unique) {
						throw new Error('Selector/common uniqueness requires the original helper and its one-dimensional string array/action pair');
					}
					unique = true;
					continue;
				}
				const type = Reflect.get(action, 'type'); const reference = Reflect.get(action, 'reference');
				const requirement: unknown = Reflect.get(action, 'requirement');
				if (shape.scalar === 'number' && shape.dimensions === 0 && !shape.nullable) {
					if (type === 'integer' && reference === v.integer) continue;
					if (((type === 'min_value' && reference === v.minValue) || (type === 'max_value' && reference === v.maxValue))
						&& typeof requirement === 'number' && Number.isFinite(requirement)) continue;
				}
				if (shape.dimensions > 0 && !shape.nullable
					&& ((type === 'min_length' && reference === v.minLength) || (type === 'max_length' && reference === v.maxLength))
					&& typeof requirement === 'number' && Number.isInteger(requirement) && requirement >= 0) continue;
				throw new Error('Selector/common fields contain an unsupported validation action');
			}
			return unique ? { ...shape, unique: true } : shape;
		}
		if (schema === misskeyId || getJsonStringLegacySchema(schema) !== undefined) return { scalar: 'string', dimensions: 0, nullable: false };
		if (schema === jsonNumber) return { scalar: 'number', dimensions: 0, nullable: false };
		const type = Reflect.get(schema, 'type'); const reference = Reflect.get(schema, 'reference');
		if (type === 'string' && reference === v.string) return { scalar: 'string', dimensions: 0, nullable: false };
		if (type === 'boolean' && reference === v.boolean) return { scalar: 'boolean', dimensions: 0, nullable: false };
		if (type === 'nullable' && reference === v.nullable && 'wrapped' in schema && schema.wrapped !== null && typeof schema.wrapped === 'object') {
			const shape = admitField(schema.wrapped, active);
			if (shape.dimensions !== 0 || shape.nullable) throw new Error('Selector/common nullable wrappers require a scalar');
			return { ...shape, nullable: true };
		}
		if (type === 'array' && reference === v.array && 'item' in schema && schema.item !== null && typeof schema.item === 'object') {
			const shape = admitField(schema.item, active);
			if (shape.scalar !== 'string' || shape.nullable || shape.dimensions >= 2 || shape.unique) throw new Error('Selector/common arrays require strings/IDs and at most two dimensions without nested unique arrays');
			return { ...shape, dimensions: shape.dimensions + 1 };
		}
		throw new Error('Selector/common fields contain an unsupported schema');
	} finally {
		active.delete(schema);
	}
}

/** Freeze public validation/default boundaries, without touching private members or payloads. */
function freezeField(schema: object, seen = new Set<object>()): void {
	if (seen.has(schema)) return;
	seen.add(schema);
	for (const key of ['wrapped', 'item']) {
		const child: unknown = Reflect.get(schema, key);
		if (child !== null && typeof child === 'object') freezeField(child, seen);
	}
	if ('pipe' in schema && Array.isArray(schema.pipe)) {
		for (const item of schema.pipe) if (item !== null && typeof item === 'object') freezeField(item, seen);
		Object.freeze(schema.pipe);
	}
	if (Reflect.get(schema, 'type') === 'metadata') {
		const annotations: unknown = Reflect.get(schema, 'metadata');
		if (annotations !== null && typeof annotations === 'object') Object.freeze(annotations);
	}
	Object.freeze(schema);
}

/** Recognize original frozen jsonObject wrappers, never reconstructed public lookalikes. */
export function selectorCommonObjectEntries(schema: object): Record<string, object> {
	const registration = getJsonObjectSchemaRegistration(schema);
	const entries: unknown = Reflect.get(schema, 'entries');
	const pipe: unknown = Reflect.get(schema, 'pipe');
	if (registration === undefined || entries === null || typeof entries !== 'object' || Array.isArray(entries)
		|| !Array.isArray(pipe) || pipe.length !== 2 || pipe[0] !== registration.guard || pipe[1] !== registration.parser
		|| Reflect.get(registration.base, 'entries') !== entries
		|| ![schema, entries, pipe, registration, registration.guard, registration.parser, registration.base].every(Object.isFrozen)) {
		throw new Error('Selector/common components must be original registered JSON-object wrappers');
	}
	const fields: Record<string, object> = {};
	for (const [key, entry] of Object.entries(entries)) {
		if (entry === null || typeof entry !== 'object') throw new Error('Selector/common entries require schemas');
		Object.defineProperty(fields, key, { value: entry, enumerable: true });
	}
	return fields;
}

export function admitSelectorCommonObject(schema: object, common: boolean): readonly string[] {
	const entries = selectorCommonObjectEntries(schema);
	for (const entry of Object.values(entries)) {
		if (common) {
			if (Reflect.get(entry, 'kind') !== 'schema' || Reflect.get(entry, 'type') !== 'optional'
				|| Reflect.get(entry, 'reference') !== v.optional || Reflect.get(entry, 'async') !== false
				|| 'pipe' in entry || 'fallback' in entry || !('wrapped' in entry) || entry.wrapped === null || typeof entry.wrapped !== 'object') {
				throw new Error('Selector/common common fields require direct outer optional wrappers');
			}
			const fallback: unknown = Reflect.get(entry, 'default');
			if (fallback !== undefined && fallback !== null && typeof fallback !== 'string' && typeof fallback !== 'boolean'
				&& !(typeof fallback === 'number' && Number.isFinite(fallback))) {
				throw new Error('Selector/common defaults must be static JSON scalars');
			}
			admitField(entry.wrapped);
		} else admitField(entry);
	}
	for (const entry of Object.values(entries)) freezeField(entry);
	return Object.freeze(Object.keys(entries));
}
