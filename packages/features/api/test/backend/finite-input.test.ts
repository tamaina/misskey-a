/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { expect, expectTypeOf, test } from 'vitest';
import { inlineTestInput, inlineTestOutput } from '@features/api/contract/endpoint-definitions.js';
import type { NativeInlineEndpoints } from '@features/api/contract/endpoint-definitions.js';
import { EndpointImplementation, paramDef } from '@features/api/backend/endpoints/test.js';

test('native test input exposes five declared fields and strips extensions without mutating the request', () => {
	expectTypeOf<keyof NativeInlineEndpoints['test']['req']>().toEqualTypeOf<'required' | 'string' | 'default' | 'nullableDefault' | 'id'>();
	expectTypeOf<v.InferOutput<typeof inlineTestInput>['default']>().toEqualTypeOf<string>();
	expectTypeOf<v.InferOutput<typeof inlineTestInput>['nullableDefault']>().toEqualTypeOf<string | null>();
	const params = { required: false, future: { retained: true } };
	const parsed = v.parse(inlineTestInput, params);
	expect(parsed).toEqual({ required: false, default: 'hello', nullableDefault: 'hello' });
	expect(Object.keys(parsed)).toEqual(['required', 'default', 'nullableDefault']);
	expect(params).toEqual({ required: false, future: { retained: true } });
	expect(v.parse(inlineTestInput, { required: true, string: '', default: '', nullableDefault: null, id: 'ABC123' })).toEqual({
		required: true, string: '', default: '', nullableDefault: null, id: 'ABC123',
	});
});

test('native test input preserves required, optional, nullable and ID validation', () => {
	for (const params of [
		{}, null, [], 'test', 1,
		{ required: null }, { required: 'true' },
		{ required: true, string: null }, { required: true, string: 1 }, { required: true, string: undefined },
		{ required: true, default: null }, { required: true, default: 1 },
		{ required: true, nullableDefault: 1 },
		{ required: true, id: '' }, { required: true, id: 'bad-id' },
		{ required: true, id: null }, { required: true, id: 1 }, { required: true, id: undefined },
	]) expect(v.safeParse(inlineTestInput, params).success).toBe(false);
	expect(v.parse(inlineTestInput, { required: true, default: undefined, nullableDefault: undefined })).toEqual({
		required: true, default: 'hello', nullableDefault: 'hello',
	});
});

test('HTTP test handler echoes the same request with defaults and arbitrary own extension keys', async () => {
	const endpoint = new EndpointImplementation();
	const extension = { nested: [null, { retained: true }] };
	const params = { required: true, future: extension, constructor: 'own constructor', toString: 'own toString' };
	const result = await endpoint.exec(params, null, null);
	expect(result).toBe(params);
	expect(result).toEqual({ ...params, default: 'hello', nullableDefault: 'hello' });
	expect(Reflect.get(result, 'future')).toBe(extension);
	expect(Object.hasOwn(result, 'constructor')).toBe(true);
	expect(Object.hasOwn(result, 'toString')).toBe(true);
	expect(Object.keys(result)).toEqual(['required', 'future', 'constructor', 'toString', 'default', 'nullableDefault']);
	expect(paramDef.additionalProperties).not.toBe(false);
	// Native output keeps ordinary extensions; the HTTP handler preserves raw own keys.
	const nativeResult = { required: true, future: extension };
	expect(v.parse(inlineTestOutput, nativeResult)).toEqual(nativeResult);
});

test('HTTP test handler retains explicit values and rejects malformed declared fields', async () => {
	const endpoint = new EndpointImplementation();
	const params = { required: false, string: '', default: '', nullableDefault: null, id: 'ABC123', future: [1, null] };
	expect(await endpoint.exec(params, null, null)).toBe(params);
	expect(params).toEqual({ required: false, string: '', default: '', nullableDefault: null, id: 'ABC123', future: [1, null] });
	for (const invalid of [
		{}, null, [], 'test', 1,
		{ required: null }, { required: 'true' },
		{ required: true, string: null }, { required: true, default: null },
		{ required: true, nullableDefault: 1 }, { required: true, id: '' }, { required: true, id: 'bad-id' },
	]) await expect(endpoint.exec(invalid, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
});
