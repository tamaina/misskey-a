/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import _Ajv from 'ajv';
import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { jsonString, misskeyId, misskeyIdPattern, objectParams, uniqueStringArray } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';

const Ajv = _Ajv.default;

function project<Input extends v.GenericSchema>(input: Input) {
	return projectEndpointContract(defineEndpointContract({ path: '/unique-string-test' }, input, v.void()));
}

function validateWithAjv<Input extends v.GenericSchema>(input: Input) {
	return new Ajv({ useDefaults: true }).addFormat('misskey:id', misskeyIdPattern).compile(project(input).input);
}

test('unique strings use exact equality and reject malformed input without rewriting it', () => {
	const input = v.looseObject({ values: uniqueStringArray(v.string()) });
	const validate = validateWithAjv(input);
	const cases: [string, unknown, boolean][] = [
		['empty array', [], true],
		['one item', ['a'], true],
		['multiple distinct items', ['b', 'a', 'c'], true],
		['adjacent duplicate', ['a', 'a'], false],
		['separated duplicate', ['a', 'b', 'a'], false],
		['duplicate at the end', ['b', 'a', 'a'], false],
		['duplicate empty strings', ['', ''], false],
		['one empty string', [''], true],
		['case distinctions', ['a', 'A'], true],
		['repeated astral string', ['😀', '😀'], false],
		['different astral strings', ['😀', '😃'], true],
		['normalization distinctions', ['é', 'e\u0301'], true],
		['repeated combining sequence', ['e\u0301', 'e\u0301'], false],
		['repeated lone surrogate', ['\uD800', '\uD800'], false],
		['different lone surrogates', ['\uD800', '\uDC00'], true],
		['null array', null, false],
		['string array', 'a', false],
		['number array', 1, false],
		['boolean array', true, false],
		['object array', {}, false],
		['null item', [null], false],
		['number item', [1], false],
		['boolean item', [true], false],
		['object item', [{}], false],
		['nested array item', [['a']], false],
		['undefined item', [undefined], false],
		['mixed items', ['a', 1], false],
	];
	for (const [label, values, expected] of cases) {
		const body = { values };
		const original = structuredClone(body);
		const native = v.safeParse(input, body);
		expect(native.success, `${label}: Valibot`).toBe(expected);
		expect(validate(body), `${label}: AJV`).toBe(expected);
		expect(body, `${label}: input retained`).toEqual(original);
		if (native.success) expect(native.output.values).toEqual(values);
	}
	expectTypeOf<v.InferInput<typeof input>['values']>().toEqualTypeOf<string[]>();
	expectTypeOf<v.InferOutput<typeof input>['values']>().toEqualTypeOf<string[]>();
});

test('Misskey identifier item validation remains paired with the legacy format', () => {
	const input = v.looseObject({ values: uniqueStringArray(misskeyId) });
	const validate = validateWithAjv(input);
	const cases: [unknown, boolean][] = [
		[['id1', 'id2'], true], [['id', 'ID'], true], [['id1', 'id1'], false],
		[['bad-id'], false], [[''], false], [['😀'], false], [[42], false],
	];
	for (const [values, expected] of cases) {
		expect(v.safeParse(input, { values }).success).toBe(expected);
		expect(validate({ values })).toBe(expected);
	}
	expect(project(input).input.properties?.values).toEqual({
		type: 'array', uniqueItems: true, items: { type: 'string', format: 'misskey:id' },
	});
});

test('supplied code-point item bounds retain astral, combining and surrogate semantics', () => {
	const input = v.looseObject({ values: uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })) });
	const validate = validateWithAjv(input);
	const cases: [unknown, boolean][] = [
		[['😀'.repeat(50)], true], [['😀'.repeat(51)], false],
		[['x'.repeat(50)], true], [['x'.repeat(51)], false], [[''], false],
		[['e\u0301'.repeat(25)], true], [['e\u0301'.repeat(26)], false],
		[['\uD800'], true], [['😀', '😀'], false], [['é', 'e\u0301'], true],
	];
	for (const [values, expected] of cases) {
		expect(v.safeParse(input, { values }).success).toBe(expected);
		expect(validate({ values })).toBe(expected);
	}
	expect(project(input).input.properties?.values).toEqual({
		type: 'array', uniqueItems: true, items: { type: 'string', minLength: 1, maxLength: 50 },
	});
	// The helper preserves a caller's own validator, including its UTF-16-unit lengths.
	const supplied = uniqueStringArray(v.pipe(v.string(), v.maxLength(1)));
	expect(v.safeParse(supplied, ['😀']).success).toBe(false);
	expect(v.safeParse(supplied, ['a']).success).toBe(true);
});

test('nested pipes, bounds, defaults and nullable wrappers preserve exact legacy and OpenAPI shapes', () => {
	const values = v.optional(v.nullable(v.pipe(
		v.pipe(uniqueStringArray(jsonString({ minLength: 1, maxLength: 50 })), v.minLength(1)),
		v.maxLength(3), v.metadata({ description: 'Choices' }),
	)), ['default']);
	const input = v.looseObject({ nested: v.looseObject({ values }) });
	const projection = project(input);
	const expected = {
		type: 'object', properties: {
			nested: {
				type: 'object', properties: {
					values: {
						type: 'array', uniqueItems: true, minItems: 1, maxItems: 3,
						items: { type: 'string', minLength: 1, maxLength: 50 },
						description: 'Choices', nullable: true, default: ['default'],
					},
				}, required: [],
			},
		}, required: ['nested'],
	};
	expect(projection.input).toEqual(expected);
	const { nullable: _nullable, ...openApiValues } = expected.properties.nested.properties.values;
	expect(convertSchemaToOpenApiSchema(projection.input, 'param', true)).toEqual({
		...expected,
		properties: { nested: { ...expected.properties.nested, properties: {
			values: { ...openApiValues, type: ['array', 'null'] },
		} } },
	});
	const validate = validateWithAjv(input);
	for (const [body, success] of [
		[{ nested: {} }, true], [{ nested: { values: null } }, true],
		[{ nested: { values: ['a', 'b'] } }, true], [{ nested: { values: ['a', 'a'] } }, false],
		[{ nested: { values: [] } }, false], [{ nested: { values: ['a', 'b', 'c', 'd'] } }, false],
	] as const) {
		const native = v.safeParse(input, structuredClone(body));
		const ajvBody = structuredClone(body);
		expect(native.success).toBe(success);
		expect(validate(ajvBody)).toBe(success);
		if (native.success) expect(ajvBody).toEqual(native.output);
	}
});

test('exact optional, nullable and array nesting retain uniqueness through preflight', () => {
	const input = v.looseObject({
		optional: v.exactOptional(uniqueStringArray(v.string())),
		nullable: v.nullable(uniqueStringArray(v.string())),
		nested: v.array(v.looseObject({ values: uniqueStringArray(v.string()) })),
	});
	const validate = validateWithAjv(input);
	const body = { nullable: null, nested: [{ values: ['a', 'A'] }] };
	expect(v.safeParse(input, body).success).toBe(true);
	expect(validate(body)).toBe(true);
	const duplicates = { nullable: null, nested: [{ values: ['a', 'a'] }] };
	expect(v.safeParse(input, duplicates).success).toBe(false);
	expect(validate(duplicates)).toBe(false);
});

test('unregistered, cloned and metadata-spoofed validation predicates fail before AJV', () => {
	const registered = uniqueStringArray(v.string());
	const cloned = { ...registered.pipe[1] };
	const spoofed = { ...registered.pipe[1], requirement: () => true };
	for (const values of [
		v.pipe(v.array(v.string()), v.check<string[]>(() => true)),
		v.pipe(v.array(v.string()), v.checkItems<string[]>(() => true)),
		v.pipe(v.array(v.string()), v.check<string[]>(() => true), v.metadata({ uniqueItems: true })),
		v.pipe(v.array(v.string()), cloned),
		v.pipe(registered.pipe[0], spoofed),
	]) {
		expect(() => project(v.looseObject({ values }))).toThrow('Legacy input contracts cannot use unregistered validation predicates');
	}
	expect(() => project(v.looseObject({ values: v.custom<string[]>(() => true) }))).toThrow();
});

test('real registered validation actions cannot be transplanted or hidden behind the seen set', () => {
	const registered = uniqueStringArray(v.string());
	const transplanted = v.pipe(v.array(v.string()), registered.pipe[1]);
	for (const input of [
		v.looseObject({ values: transplanted }),
		v.looseObject({ original: registered, values: transplanted }),
	]) {
		expect(() => project(input)).toThrow('Unique string array validation must follow its original array schema');
	}
	expect(Object.isFrozen(registered.pipe[0])).toBe(true);
	expect(Object.isFrozen(registered.pipe[1])).toBe(true);
});

test('misused helpers cannot project non-string arrays or allow transformations', () => {
	// @ts-expect-error This helper is intentionally restricted to string item schemas.
	const numbers = uniqueStringArray(v.number());
	expect(v.safeParse(numbers, [1, 2]).success).toBe(false);
	expect(() => project(v.looseObject({ values: numbers }))).toThrow('Unique string arrays require an array of string items');
	const transformed = uniqueStringArray(v.pipe(v.string(), v.transform(value => value.toLowerCase())));
	expect(() => project(v.looseObject({ values: transformed }))).toThrow('Legacy input contracts cannot perform transformations');
	const spoofed = uniqueStringArray(v.pipe(v.string(), v.metadata({ type: 'object' })));
	expect(() => project(v.looseObject({ values: spoofed }))).toThrow('Unique string array pipelines require annotation-only metadata');
});

test('action overrides fall back to unique arrays and every existing schema helper', () => {
	const unrelated = v.check<string>(() => true);
	const schema = v.looseObject({
		values: uniqueStringArray(jsonString({ minLength: 1 })),
		id: misskeyId, params: objectParams,
		custom: v.pipe(v.string(), unrelated),
	});
	const projected = toLegacyJsonSchema(schema, {
		overrideSchema: () => undefined,
		overrideAction: ({ valibotAction, jsonSchema }) => valibotAction === unrelated
			? { ...jsonSchema, pattern: '^custom$' }
			: undefined,
	});
	expect(projected.properties?.values).toEqual({ type: 'array', uniqueItems: true, items: { type: 'string', minLength: 1 } });
	expect(projected.properties?.id).toEqual({ type: 'string', format: 'misskey:id' });
	expect(projected.properties?.params).toEqual({ type: 'object', properties: {}, additionalProperties: true });
	expect(projected.properties?.custom).toEqual({ type: 'string', pattern: '^custom$' });
	expect(toLegacyJsonSchema(uniqueStringArray(v.string()), { overrideAction: () => null })).toEqual({
		type: 'array', items: { type: 'string' }, uniqueItems: true,
	});
	expect(toLegacyJsonSchema(uniqueStringArray(v.string()), { overrideAction: () => ({ type: 'number' }) })).toEqual({ type: 'number' });
});

test('legacy transport retains its duplicate error and passes the original payload to the handler', async () => {
	const projection = project(v.looseObject({ values: uniqueStringArray(v.string()) }));
	const body = { values: ['b', 'a'], future: { retained: true } };
	let calls = 0;
	const endpoint = new ContractEndpoint({}, projection, async input => {
		calls++;
		expect(input).toBe(body);
	});
	await expect(endpoint.exec({ values: ['a', 'a'] }, null, null)).rejects.toMatchObject({
		code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		info: { param: '#/properties/values/uniqueItems', reason: 'must NOT have duplicate items (items ## 1 and 0 are identical)' },
	});
	expect(calls).toBe(0);
	await expect(endpoint.exec(body, null, null)).resolves.toBeUndefined();
	expect(calls).toBe(1);
});

test('validation metadata cannot overwrite registered uniqueness at any pipeline level', () => {
	const helper = uniqueStringArray(v.string());
	const disguised = { ...v.check<string[]>(() => true), type: 'metadata', metadata: { uniqueItems: false } };
	for (const values of [
		v.pipe(helper, v.metadata({ uniqueItems: false })),
		v.pipe(v.pipe(helper, v.metadata({ uniqueItems: true })), v.metadata({ items: { type: 'number' } })),
		uniqueStringArray(v.pipe(v.string(), v.metadata({ nullable: true }))),
		uniqueStringArray(v.pipe(v.string(), v.metadata({ minLength: 1 }))),
		v.pipe(v.nullable(helper), v.metadata({ default: ['x'] })),
		v.pipe(v.optional(helper), v.metadata({ type: 'string' })),
	]) {
		expect(() => project(v.looseObject({ values })))
			.toThrow('Unique string array pipelines require annotation-only metadata');
		expect(() => toLegacyJsonSchema(values))
			.toThrow('Unique string array pipelines require annotation-only metadata');
	}
	expect(() => project(v.looseObject({ values: v.pipe(helper, disguised) })))
		.toThrow('Unique string array pipelines cannot use disguised metadata predicates');
	const annotationDisguise = {
		...v.check<string[]>(values => values.length === 1),
		type: 'metadata', metadata: { description: 'Harmless-looking annotation' },
	};
	const disguisedPredicate = v.pipe(helper, annotationDisguise);
	expect(v.safeParse(disguisedPredicate, ['a', 'b']).success).toBe(false);
	expect(() => project(v.looseObject({ values: disguisedPredicate })))
		.toThrow('Unique string array pipelines cannot use disguised metadata predicates');
	const beforeCheck = v.pipe(helper.pipe[0], v.metadata({ uniqueItems: false }), helper.pipe[1]);
	expect(() => project(v.looseObject({ values: beforeCheck })))
		.toThrow('Unique string array pipelines require annotation-only metadata');
	const ancestor = v.pipe(v.looseObject({ values: helper }), v.metadata({ properties: {} }));
	expect(() => project(ancestor)).toThrow('Unique string array pipelines require annotation-only metadata');
});

test('shared metadata and item schemas cannot bypass protected-context validation', () => {
	const itemMetadata = v.metadata<string, { nullable: true }>({ nullable: true });
	const sharedItem = v.pipe(v.string(), itemMetadata);
	const arrayMetadata = v.metadata<string[], { nullable: true }>({ nullable: true });
	const sharedArray = v.pipe(v.array(v.string()), arrayMetadata);
	for (const input of [
		v.looseObject({ sibling: sharedItem, values: uniqueStringArray(sharedItem) }),
		v.looseObject({ values: uniqueStringArray(sharedItem), sibling: sharedItem }),
		v.looseObject({ sibling: sharedArray, values: v.pipe(uniqueStringArray(v.string()), arrayMetadata) }),
	]) {
		expect(() => project(input)).toThrow('Unique string array pipelines require annotation-only metadata');
	}
});

test('annotations at helper, ancestor and item levels preserve uniqueness and unrelated metadata', () => {
	const annotatedItem = v.pipe(v.string(), v.metadata({ description: 'An item' }));
	const helper = v.pipe(uniqueStringArray(annotatedItem), v.metadata({ title: 'Unique values' }));
	const sibling = v.pipe(v.string(), v.metadata({ nullable: true }));
	const registry = v.pipe(v.looseObject({ scope: v.optional(v.array(v.string()), []) }),
		v.metadata({ required: ['scope'] }));
	const input = v.pipe(v.looseObject({ values: helper, sibling, registry }),
		v.metadata({ description: 'Containing object' }));
	const projection = project(input);
	expect(projection.input.description).toBe('Containing object');
	expect(projection.input.properties?.values).toEqual({
		type: 'array', uniqueItems: true, title: 'Unique values',
		items: { type: 'string', description: 'An item' },
	});
	expect(projection.input.properties?.sibling).toEqual({ type: 'string', nullable: true });
	expect(projection.input.properties?.registry).toEqual({
		type: 'object', required: ['scope'], properties: {
			scope: { type: 'array', items: { type: 'string' }, default: [] },
		},
	});
	const validate = validateWithAjv(input);
	expect(validate({ values: ['a', 'A'], sibling: 'x', registry: {} })).toBe(true);
	expect(validate({ values: ['a', 'a'], sibling: 'x', registry: {} })).toBe(false);
	// Contracts without the helper retain the established structural-metadata behavior.
	expect(toLegacyJsonSchema(v.pipe(v.array(v.string()), v.metadata({ uniqueItems: false }))))
		.toEqual({ type: 'array', items: { type: 'string' }, uniqueItems: false });
});
