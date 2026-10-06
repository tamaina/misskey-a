/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { toLegacyJsonSchema } from '../../../backend/built/features/api/backend.js';
import { legacyPingSchemas, legacyEndpointsSchemas } from '../../../backend/built/features/instance/backend.js';

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
