/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import Ajv from 'ajv';
import { addGlobalDefs, getGlobalDefs } from '@valibot/to-json-schema';
import { jsonValueSchema, getJsonValueReference } from '../../contract/json-value.js';
import type { JsonValue } from '../../contract/json-value.js';
import { defineEndpointContract } from '../../contract/definition.js';
import { toLegacyJsonSchema } from '../../backend/index.js';
import { getJsonValueComponents } from '../../backend/json-value-projection.js';
import { ContractEndpoint, projectEndpointContract } from '../../backend/transport/contract-endpoint.js';
import { getSchemas, convertSchemaToOpenApiSchema } from '../../backend/transport/openapi/schemas.js';
import { packedSchemas } from '../../../index/contract/packed.js';

vi.mock('@features/index/backend/endpoints.js', () => ({ endpoints: [] }));

const definition = (output: v.GenericSchema) => defineEndpointContract({ path: '/json-value-proof' }, v.object({}), output);
const values: JsonValue[] = [null, true, false, '', '😀', 0, -0, 1.25, Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, [], {}, { future: [null, false, { nested: ['text', 3] }] }];

test('public input/output inference exposes only recursive JSON wire values', () => {
	expectTypeOf<v.InferInput<typeof jsonValueSchema>>().toEqualTypeOf<JsonValue>();
	expectTypeOf<v.InferOutput<typeof jsonValueSchema>>().toEqualTypeOf<JsonValue>();
	for (const value of values) {
		expect(v.is(jsonValueSchema, value)).toBe(true);
		const wire = JSON.parse(JSON.stringify(value));
		expect(v.parse(jsonValueSchema, wire)).toEqual(wire);
		expect(JSON.stringify(v.parse(jsonValueSchema, wire))).toBe(JSON.stringify(wire));
	}
});

test('native non-JSON values are rejected instead of being normalized', () => {
	const cycle: { self?: object } = {}; cycle.self = cycle;
	for (const value of [undefined, NaN, Infinity, -Infinity, 1n, new Date('2026-01-01'), new Map(), () => 1, Symbol('value'), cycle, [cycle], [undefined], { value: undefined }, { value: Infinity }]) {
		expect(v.safeParse(jsonValueSchema, value).success).toBe(false);
	}
	const shared = { value: [1, 2] };
	expect(v.is(jsonValueSchema, [shared, shared])).toBe(true);
});

test('every own JSON key survives, is recursively validated, and cannot mutate prototypes', () => {
	const value = JSON.parse('{"__proto__":{"future":[1,null]},"constructor":false,"prototype":"keep","toString":7,"nested":{"__proto__":null}}');
	expect(v.parse(jsonValueSchema, value)).toBe(value);
	expect(JSON.stringify(v.parse(jsonValueSchema, value))).toBe(JSON.stringify(value));
	expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
	for (const key of ['__proto__', 'constructor', 'prototype', 'toString']) {
		const malformed = Object.create(null);
		Object.defineProperty(malformed, key, { value: undefined, enumerable: true });
		expect(v.is(jsonValueSchema, malformed)).toBe(false);
	}
	expect(v.is(jsonValueSchema, { [Symbol('key')]: 1 })).toBe(false);
});

test('recursive component has one deterministic name, finite bounds and terminating references', () => {
	const components = getJsonValueComponents();
	expect(Object.keys(components)).toEqual(['JsonValue']);
	expect(components).toEqual(getJsonValueComponents());
	expect(components.JsonValue.anyOf).toEqual([
		{ type: 'null' }, { type: 'string' }, { type: 'boolean' },
		{ type: 'number', minimum: -Number.MAX_VALUE, maximum: Number.MAX_VALUE },
		{ type: 'array', items: { $ref: '#/components/schemas/JsonValue' } },
		{ type: 'object', propertyNames: { type: 'string' }, additionalProperties: { $ref: '#/components/schemas/JsonValue' } },
	]);
	expect(JSON.stringify(components)).not.toContain('$defs');
	expect(Object.keys(packedSchemas)).not.toContain('JsonValue');
	expect(getSchemas(true).JsonValue).toEqual(components.JsonValue);
	const validator = new Ajv({ strict: false, strictNumbers: true }).compile({ ...components.JsonValue, components: { schemas: components } });
	for (const value of values) expect(validator(JSON.parse(JSON.stringify(value)))).toBe(true);
	for (const value of [NaN, Infinity, -Infinity, { future: undefined }, [undefined]]) expect(validator(value)).toBe(false);
});

test('only owned canonical output instances get the legacy reference, including wrappers and typed extension maps', () => {
	expect(getJsonValueReference(jsonValueSchema)).toBe('JsonValue');
	const output = v.strictObject({ value: jsonValueSchema, optional: v.optional(jsonValueSchema), nullable: v.nullable(jsonValueSchema), extensions: v.objectWithRest({ known: v.string() }, jsonValueSchema) });
	const projected = projectEndpointContract(definition(output));
	expect(projected.response?.properties?.value).toEqual({ ref: 'JsonValue', optional: false });
	const documented = convertSchemaToOpenApiSchema(projected.response!, 'res', true);
	expect(documented.properties.value).toEqual({ $ref: '#/components/schemas/JsonValue' });
	expect(documented.properties.extensions.additionalProperties).toEqual({ $ref: '#/components/schemas/JsonValue' });
	expect(toLegacyJsonSchema(v.pipe(jsonValueSchema, v.description('JSON wire value')), { typeMode: 'output' })).toEqual({ ref: 'JsonValue', description: 'JSON wire value' });
	expect(toLegacyJsonSchema(jsonValueSchema, { typeMode: 'output' })).toEqual({ ref: 'JsonValue' });
});

test('unregistered refs, inputs and schema-changing metadata remain rejected', () => {
	expect(getJsonValueReference({ ...jsonValueSchema })).toBeUndefined();
	const recursive: v.GenericSchema = v.lazy(() => v.object({ child: v.optional(recursive) }));
	for (const output of [recursive, v.pipe(v.string(), v.metadata({ $ref: '#/components/schemas/JsonValue' })), v.pipe(v.string(), v.metadata({ ref: 'JsonValue' }))]) {
		expect(() => projectEndpointContract(definition(output))).toThrow();
	}
	for (const output of [v.pipe(jsonValueSchema, v.metadata({ type: 'object' })), v.pipe(v.strictObject({ value: jsonValueSchema }), v.metadata({ additionalProperties: true })), v.pipe(v.lazy(() => jsonValueSchema), v.metadata({ type: 'object' }))]) {
		expect(() => projectEndpointContract(definition(output))).toThrow('annotation-only metadata');
	}
	expect(() => projectEndpointContract(defineEndpointContract({ path: '/json-value-input' }, v.object({ value: jsonValueSchema }), v.void()))).toThrow('output-only JSON value references');
});

test('HTTP still returns unparsed native values and existing serialization succeeds or fails unchanged', async () => {
	const native = { date: new Date('2026-01-01T00:00:00Z'), omitted: undefined, nonfinite: NaN, buffer: Buffer.from([1, 2]) };
	const projected = projectEndpointContract(definition(jsonValueSchema));
	// Raw native producer values deliberately differ from the documented JSON wire type.
	const endpoint = new ContractEndpoint({}, projected, async () => native);
	expect(await endpoint.exec({}, null, null)).toBe(native);
	const wire = JSON.parse(JSON.stringify(native));
	expect(wire).toEqual({ date: '2026-01-01T00:00:00.000Z', nonfinite: null, buffer: { type: 'Buffer', data: [1, 2] } });
	expect(v.parse(jsonValueSchema, wire)).toEqual(wire);
	expect(() => JSON.stringify({ bigint: 1n })).toThrow();
	const cycle: { self?: object } = {}; cycle.self = cycle;
	expect(() => JSON.stringify(cycle)).toThrow();
});

test('metadata protection includes named and global definitions and leaves canonical components immutable', () => {
	const bad = v.pipe(v.lazy(() => jsonValueSchema), v.metadata({ type: 'object' }));
	expect(() => toLegacyJsonSchema(v.string(), { typeMode: 'output', definitions: { HiddenJsonValue: bad } })).toThrow('annotation-only metadata');
	addGlobalDefs({ JsonValueMetadataRegression: bad });
	try {
		expect(() => toLegacyJsonSchema(v.string(), { typeMode: 'output' })).toThrow('annotation-only metadata');
	} finally {
		const definitions = getGlobalDefs();
		if (definitions !== undefined) delete definitions.JsonValueMetadataRegression;
	}
	expect(Object.isFrozen(jsonValueSchema)).toBe(true);
	expect(getJsonValueComponents()).toEqual(getJsonValueComponents());
});
