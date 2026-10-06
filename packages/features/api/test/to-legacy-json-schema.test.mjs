/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { jsonString, toLegacyJsonSchema } from '../../../backend/built/features/api/backend.js';
import { legacyPingSchemas, legacyEndpointsSchemas } from '../../../backend/built/features/instance/backend.js';

const Ajv = createRequire(new URL('../../../backend/package.json', import.meta.url))('ajv');

function withoutDialect(schema) {
	const legacySchema = { ...schema };
	delete legacySchema.$schema;
	return legacySchema;
}

test('uses legacy open object semantics for the shared API params schema', () => {
	assert.deepEqual(legacyEndpointsSchemas.input, { type: 'object', properties: {} });
	assert.deepEqual(legacyPingSchemas.input, {
		type: 'object',
		properties: {},
		additionalProperties: true,
	});
});

test('allows an explicit overrideSchema to replace the default override', () => {
	const objectParams = v.custom(() => true);
	const config = {
		overrideSchema: ({ valibotSchema }) => valibotSchema === objectParams
			? { type: 'string', description: 'caller override' }
			: undefined,
	};

	assert.deepEqual(toLegacyJsonSchema(objectParams, config), {
		type: 'string',
		description: 'caller override',
	});
});

test('forwards an explicit target and strips only the generated dialect field', () => {
	const schema = v.nullable(v.string());
	const config = { target: 'openapi-3.0' };
	const generated = toJsonSchema(schema, config);

	assert.equal(generated.nullable, true);
	assert.deepEqual(toLegacyJsonSchema(schema, config), withoutDialect(generated));
});

test('preserves every generated schema field other than the top-level dialect', () => {
	const schema = v.object({ name: v.string(), count: v.number() });
	const generated = toJsonSchema(schema);

	assert.deepEqual(toLegacyJsonSchema(schema), withoutDialect(generated));
});

test('projects jsonString constraints as an exact legacy string schema and snapshots options', () => {
	const options = { minLength: 1, maxLength: 2 };
	const schema = jsonString(options);
	options.minLength = 0;
	options.maxLength = 1;

	assert.deepEqual(toLegacyJsonSchema(schema), { type: 'string', minLength: 1, maxLength: 2 });
	assert.equal(v.safeParse(schema, '').success, false);
	assert.equal(v.safeParse(schema, 'ab').success, true);
	assert.equal(v.safeParse(schema, 'abc').success, false);
	assert.deepEqual(toLegacyJsonSchema(jsonString({ minLength: 0 })), { type: 'string', minLength: 0 });
	assert.deepEqual(toLegacyJsonSchema(jsonString()), { type: 'string' });
});

test('jsonString validation matches AJV code-point length semantics', () => {
	const schema = jsonString({ minLength: 1, maxLength: 100 });
	const validate = new Ajv().compile({ type: 'string', minLength: 1, maxLength: 100 });
	const cases = [
		['ASCII', 'ascii', true],
		['one astral emoji', '😀', true],
		['100 astral emoji at the maximum', '😀'.repeat(100), true],
		['101 astral emoji above the maximum', '😀'.repeat(101), false],
		['combining mark sequence', 'e\u0301', true],
		['lone high surrogate', '\uD800', true],
		['empty string below the minimum', '', false],
		['one code point at the minimum', 'x', true],
		['100 ASCII code points at the maximum', 'x'.repeat(100), true],
		['101 ASCII code points above the maximum', 'x'.repeat(101), false],
		['null is not a string', null, false],
		['number is not a string', 42, false],
		['object is not a string', {}, false],
	];

	for (const [label, value, expected] of cases) {
		const actual = v.safeParse(schema, value).success;
		assert.equal(actual, expected, `${label}: jsonString`);
		assert.equal(validate(value), expected, `${label}: AJV`);
	}
});

test('allows an explicit override to replace a jsonString projection', () => {
	assert.deepEqual(toLegacyJsonSchema(jsonString({ minLength: 1 }), {
		overrideSchema: () => ({ type: 'number', description: 'caller override' }),
	}), { type: 'number', description: 'caller override' });
});
