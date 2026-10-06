/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '../../../../features/api/contract/definition.js';
import { jsonString, misskeyId } from '../../../../features/api/contract/index.js';
import { resultObject } from '../../../../features/api/contract/result-object.js';
import { ContractEndpoint, projectEndpointContract } from './contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from './openapi/schemas.js';

const definition = defineEndpointContract({ method: 'POST', path: '/test' }, v.looseObject({
	name: jsonString({ minLength: 2 }),
	id: v.optional(misskeyId),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 10),
}), resultObject({ name: v.string(), extra: v.optional(v.string()) }));
const projection = projectEndpointContract(definition);

test('contract bridge retains AJV defaults and the original open input object', async () => {
	const params = { name: 'ab', future: true };
	const response = { name: 'result', opaque: { retained: true } };
	const endpoint = new ContractEndpoint({}, projection, async input => {
		expectTypeOf(input.name).toEqualTypeOf<string>();
		expectTypeOf(input.limit).toEqualTypeOf<number>();
		expect(input).toBe(params);
		expect(input).toEqual({ name: 'ab', future: true, limit: 10 });
		return response;
	});
	expect(await endpoint.exec(params, null, null)).toBe(response);
});

test('the legacy invalid-parameter contract and Unicode code-point lengths are retained', async () => {
	let calls = 0;
	const endpoint = new ContractEndpoint({}, projection, async () => { calls++; return { name: 'ok' }; });
	await expect(endpoint.exec({ name: '😀' }, null, null)).rejects.toMatchObject({
		code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532',
		info: { param: '#/properties/name/minLength', reason: 'must NOT have fewer than 2 characters' },
	});
	await expect(endpoint.exec({ name: 'ab', id: 'bad-id' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(calls).toBe(0);
	await expect(endpoint.exec({ name: '😀a' }, null, null)).resolves.toEqual({ name: 'ok' });
});

test('response schema controls types and documentation, without introducing output parsing', async () => {
	// @ts-expect-error Invalid output remains a compile-time error even though legacy transport does not validate it.
	const endpoint = new ContractEndpoint({}, projection, async () => 42);
	expect(await endpoint.exec({ name: 'ab' }, null, null)).toBe(42);
	const schema = convertSchemaToOpenApiSchema(projection.response!, 'res', true);
	expect(schema.required).toEqual(['name']);
	expect(schema.properties.extra).toEqual({ type: 'string' });
});

test('input transformations cannot silently diverge from the legacy validator', () => {
	const transformed = defineEndpointContract({ path: '/transform' },
		v.pipe(v.string(), v.transform(value => value.length)), v.number());
	expect(() => projectEndpointContract(transformed)).toThrow('Legacy input contracts cannot perform transformations');
});

test('runtime fallbacks and dynamic defaults cannot be silently frozen into input schemas', () => {
	for (const input of [
		v.looseObject({ value: v.fallback(v.number(), 1) }),
		v.looseObject({ value: v.optional(v.number(), () => Date.now()) }),
		v.looseObject({ value: v.lazy(() => v.number()) }),
	]) {
		expect(() => projectEndpointContract(defineEndpointContract({ path: '/unsupported' }, input, v.void())))
			.toThrow(/Legacy input contracts|Lazy input schemas/);
	}
});

test('root defaults are not advertised as if AJV applied them', () => {
	const optionalBody = defineEndpointContract({ path: '/optional' },
		v.optional(v.looseObject({}), {}), v.void());
	expect(() => projectEndpointContract(optionalBody)).toThrow('Legacy input contracts require an explicit object body');
});

test('unresolved response references fail during projection instead of leaking broken OpenAPI refs', () => {
	for (const output of [
		v.lazy(() => v.string()),
		v.record(v.string(), v.lazy(() => v.string())),
	]) {
		expect(() => projectEndpointContract(defineEndpointContract({ path: '/reference' }, v.looseObject({}), output)))
			.toThrow(/explicit legacy projection/);
	}
});

test('all-optional response objects retain legacy required-list behavior', () => {
	const projected = projectEndpointContract(defineEndpointContract({ path: '/optional-result' },
		v.looseObject({}), resultObject({ value: v.optional(v.string()) })));
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({
		type: 'object', properties: { value: { type: 'string' } },
	});
});
