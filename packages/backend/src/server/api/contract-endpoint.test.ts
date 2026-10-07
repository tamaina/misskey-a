/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '@features/api/contract/definition.js';
import { jsonString, misskeyId, objectParams } from '@features/api/contract/index.js';
import { getPackedReference, packedReference } from '@features/api/contract/packed-reference.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { Packed } from '@features/index/contract/packed.js';
import { resultObject } from '@features/api/contract/result-object.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { convertSchemaToOpenApiSchema } from '@features/api/backend/transport/openapi/schemas.js';

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

test('optional root results preserve the no-content branch in types and metadata', async () => {
	const optional = defineEndpointContract({ path: '/optional-output' }, v.looseObject({}),
		v.optional(resultObject({ text: v.string() })));
	const projected = projectEndpointContract(optional);
	expect(projected.response?.optional).toBe(true);
	const endpoint = new ContractEndpoint({}, projected, async () => undefined);
	expectTypeOf(await endpoint.exec({}, null, null)).toMatchTypeOf<{ text: string } | undefined>();
	await expect(endpoint.exec({}, null, null)).resolves.toBeUndefined();
});

test('opaque object results preserve the existing schema shape and payload', async () => {
	const projected = projectEndpointContract(defineEndpointContract({ path: '/opaque' },
		v.looseObject({}), resultObject({})));
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({ type: 'object' });
	const value = { extension: { retained: true } };
	const endpoint = new ContractEndpoint({}, projected, async () => value);
	expect(await endpoint.exec({}, null, null)).toBe(value);
});

test('recursive packed Note references project by registry name without expansion', () => {
	const note = packedReference('Note');
	expect(v.is(note, {})).toBe(false);
	const projected = projectEndpointContract(defineEndpointContract(
		{ path: '/packed-note' }, v.looseObject({}), note,
	));
	expect(projected.response).toEqual({ type: 'object', ref: 'Note' });
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({
		$ref: '#/components/schemas/Note',
	});
});

test('packed references are recognized through a direct metadata pipe', () => {
	const output = v.pipe(packedReference('Note'), v.metadata({ description: 'A packed note.' }));
	const projected = projectEndpointContract(defineEndpointContract(
		{ path: '/packed-note-metadata' }, v.looseObject({}), output,
	));
	expect(projected.response?.ref).toBe('Note');
	expect(projected.response?.description).toBe('A packed note.');
	expect(convertSchemaToOpenApiSchema(projected.response!, 'res', true)).toEqual({
		description: 'A packed note.',
		$ref: '#/components/schemas/Note',
	});
});

test('nullable packed references retain pipe metadata through legacy projection', () => {
	const output = v.pipe(
		v.nullable(packedReference('Note')),
		v.metadata({ description: 'A packed note, or null.' }),
	);
	const projected = projectEndpointContract(defineEndpointContract(
		{ path: '/nullable-packed-note' }, v.looseObject({}), output,
	));
	const openApi = convertSchemaToOpenApiSchema(projected.response!, 'res', true);
	expect(openApi.description).toBe('A packed note, or null.');
	expect(openApi.oneOf).toEqual([
		{ $ref: '#/components/schemas/Note' },
		{ type: 'null' },
	]);
});

test('typed additionalProperties packed references are projected by the endpoint bridge', () => {
	const projected = projectEndpointContract(defineEndpointContract(
		{ path: '/packed-note-map' }, v.looseObject({}), v.record(v.string(), packedReference('Note')),
	));
	expect(projected.response?.additionalProperties).toEqual({
		$ref: '#/components/schemas/Note',
	});
});

test('packed references reject unknown own and inherited registry names', () => {
	expect(() => packedReference('toString' as never)).toThrow('Unknown packed schema: toString');
	expect(() => packedReference('DefinitelyUnknown' as never)).toThrow('Unknown packed schema: DefinitelyUnknown');
});

test('packed references are rejected as endpoint inputs before AJV projection', () => {
	const input = v.looseObject({ note: packedReference('Note') });
	expect(() => projectEndpointContract(defineEndpointContract(
		{ path: '/packed-note-input' }, input, v.void(),
	))).toThrow('Legacy input contracts cannot use packed references');
});

test('the generic legacy converter does not assign output-only packed references', () => {
	expect(() => toLegacyJsonSchema(packedReference('Note'), { target: 'openapi-3.0', typeMode: 'output' }))
		.toThrow();
});

test('custom converter overrides fall back to every built-in schema projection', () => {
	const custom = v.custom<string>(value => typeof value === 'string');
	const packed = packedReference('Note');
	const outputOverride = ({ valibotSchema }: { valibotSchema: object }) => {
		if (valibotSchema === custom) return { type: 'string' as const, pattern: '^custom$' };
		const reference = getPackedReference(valibotSchema);
		return reference === undefined ? undefined : { type: 'object' as const, ref: reference };
	};
	const schema = toLegacyJsonSchema(v.looseObject({
		params: objectParams,
		id: misskeyId,
		text: jsonString({ minLength: 2 }),
		packed,
		custom,
	}), {
		target: 'openapi-3.0',
		typeMode: 'ignore',
		overrideSchema: outputOverride,
	});
	expect(schema.properties?.params).toEqual({ type: 'object', properties: {}, additionalProperties: true });
	expect(schema.properties?.id).toEqual({ type: 'string', format: 'misskey:id' });
	expect(schema.properties?.text).toEqual({ type: 'string', minLength: 2 });
	expect(schema.properties?.packed).toEqual({ type: 'object', ref: 'Note' });
	expect(schema.properties?.custom).toEqual({ type: 'string', pattern: '^custom$' });
});

test('packed response handlers return the original payload object without parsing', async () => {
	const output = packedReference('EmojiSimple');
	expectTypeOf<v.InferOutput<typeof output>>().toEqualTypeOf<Packed<'EmojiSimple'>>();
	const value: Packed<'EmojiSimple'> & { retainedExtension: boolean } = {
		aliases: ['smile'],
		name: 'smile',
		category: null,
		url: 'https://example.test/smile.png',
		retainedExtension: true,
	};
	const projection = projectEndpointContract(defineEndpointContract(
		{ path: '/packed-emoji' }, v.looseObject({}), output,
	));
	const endpoint = new ContractEndpoint({}, projection, async () => value);
	const returned = await endpoint.exec({}, null, null);
	expect(returned).toBe(value);
	expect(returned).toHaveProperty('retainedExtension', true);
});
