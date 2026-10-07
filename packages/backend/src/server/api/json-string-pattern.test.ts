/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { jsonString, getJsonStringLegacySchema } from '../../../../features/api/contract/index.js';
import { jsonObject } from '../../../../features/api/contract/json-object.js';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import { pageNameSchema } from '../../../../features/pages/contract/page-name.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { Endpoint } from './endpoint-base.js';

const meta = { requireCredential: false } as const;

test('jsonString without a pattern retains its existing Unicode length projection', () => {
	const schema = jsonString({ minLength: 2, maxLength: 3 });
	expect(getJsonStringLegacySchema(schema)).toEqual({ type: 'string', minLength: 2, maxLength: 3 });
	for (const value of ['ab', 'abc', '😀😀', '😀😀😀']) expect(v.safeParse(schema, value).success).toBe(true);
	for (const value of ['', 'a', '😀', 'abcd', '😀😀😀😀', null, 42]) expect(v.safeParse(schema, value).success).toBe(false);
});

test('jsonString captures its pattern and length options before caller mutation', () => {
	const options = { minLength: 1, maxLength: 3, pattern: '^[a-z]+$' };
	const schema = jsonString(options);
	options.minLength = 20;
	options.maxLength = 200;
	options.pattern = '^.*$';
	const legacy = getJsonStringLegacySchema(schema);
	expect(legacy).toEqual({ type: 'string', minLength: 1, maxLength: 3, pattern: '^[a-z]+$' });
	expect(Object.isFrozen(legacy)).toBe(true);
	for (const value of ['a', 'abc', 'abc']) expect(v.safeParse(schema, value).success).toBe(true);
	for (const value of ['', 'abcd', '123', '😀']) expect(v.safeParse(schema, value).success).toBe(false);
});

test('jsonString fails fast on an invalid Unicode JSON Schema pattern', () => {
	expect(() => jsonString({ pattern: '[' })).toThrow(SyntaxError);
	const emptyPattern = jsonString({ pattern: '' });
	expect(getJsonStringLegacySchema(emptyPattern)).toEqual({ type: 'string', pattern: '' });
	for (const value of ['', 'abc', '😀', '\n']) expect(v.safeParse(emptyPattern, value).success).toBe(true);
});

const cases = [
	{ pattern: '^.$', values: ['', 'a', '😀', 'aa', '😀😀', '\n', '\uD800'] },
	{ pattern: '^.{2,3}$', minLength: 2, maxLength: 3, values: ['', 'a', 'ab', 'abc', 'abcd', '😀😀', '😀😀😀', '😀😀😀😀', 'a\n'] },
	{ pattern: '^[a-z]+$', minLength: 1, maxLength: 3, values: ['', 'a', 'abc', 'abcd', 'ABC', '😀', '\n'] },
	{ pattern: pageNameSchema.pattern, minLength: 1, values: ['name', '😀'.repeat(128), '😀'.repeat(129), '😀'.repeat(256), '😀'.repeat(257), '', 'bad name', 'bad/name', 'bad\nname'] },
] as const;

for (const item of cases) {
	test(`jsonString pattern ${item.pattern} preserves exact AJV projection and parsing`, async () => {
		const { values, ...options } = item;
		const schema = jsonString(options);
		const definition = defineEndpointContract({ method: 'POST', path: '/json-string-pattern-test' }, jsonObject({ value: schema }), v.void());
		const projection = projectEndpointContract(definition);
		const legacySchema = { type: 'object', properties: { value: { type: 'string', ...options } }, required: ['value'] } as const;
		expect(JSON.parse(JSON.stringify(projection.input))).toEqual(legacySchema);
		const original = new Endpoint(meta, legacySchema, async () => {});
		const current = new ContractEndpoint(meta, projection, async () => {});
		for (const value of [...values, null, 42]) {
			const before = { value };
			const after = { value };
			const accepted = async (endpoint: { exec: (input: unknown, me: null, token: null) => Promise<unknown> }, input: unknown) => {
				try {
					await endpoint.exec(input, null, null);
					return true;
				} catch (error) {
					expect(error).toMatchObject({ code: 'INVALID_PARAM' });
					return false;
				}
			};
			const expected = await accepted(original, before);
			expect(await accepted(current, after)).toBe(expected);
			expect(v.safeParse(definition.input, { value }).success).toBe(expected);
			expect(after).toEqual(before);
		}
	});
}
