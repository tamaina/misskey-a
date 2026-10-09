/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { expect, expectTypeOf, test } from 'vitest';
import { testInput as inlineTestInput, testOutput as inlineTestOutput } from '../../backend/endpoints/test.contract.js';
import { createProcedureClient } from '@orpc/server';
import { mockDeep } from 'vitest-mock-extended';
import type { ApiContext } from '../../backend/transport/context.js';
import { createTestProcedure } from '../../backend/endpoints/test.js';

test('native test input exposes five declared fields and strips extensions without mutating the request', () => {
	expectTypeOf<keyof v.InferInput<typeof inlineTestInput>>().toEqualTypeOf<'required' | 'string' | 'default' | 'nullableDefault' | 'id'>();
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

test('native test procedure validates and strips unused fields without mutating its caller', async () => {
 const context = mockDeep<ApiContext>();
 context.services.authenticate.mockResolvedValue([null, null]);
 const client = createProcedureClient(createTestProcedure(), { context });
 const params = { required: true, future: { retained: true } };
 expect(await client(params)).toEqual({ required: true, default: 'hello', nullableDefault: 'hello' });
 expect(params).toEqual({ required: true, future: { retained: true } });
 expect(v.safeParse(inlineTestOutput, { required: true, default: 'hello', nullableDefault: null, future: true }).success).toBe(false);
 await expect(client({ required: true, id: 'bad-id' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
});
