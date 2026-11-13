/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { jsonString } from '@features/api/backend/transport/string.schema.js';

test('jsonString without a pattern retains its existing Unicode code point lengths', () => {
	const schema = jsonString({ minLength: 2, maxLength: 3 });
	for (const value of ['ab', 'abc', '😀😀', '😀😀😀']) expect(v.safeParse(schema, value).success).toBe(true);
	for (const value of ['', 'a', '😀', 'abcd', '😀😀😀😀', null, 42]) expect(v.safeParse(schema, value).success).toBe(false);
});

test('jsonString captures its pattern and length options before caller mutation', () => {
	const options = { minLength: 1, maxLength: 3, pattern: '^[a-z]+$' };
	const schema = jsonString(options);
	options.minLength = 20;
	options.maxLength = 200;
	options.pattern = '^.*$';
	for (const value of ['a', 'abc', 'abc']) expect(v.safeParse(schema, value).success).toBe(true);
	for (const value of ['', 'abcd', '123', '😀']) expect(v.safeParse(schema, value).success).toBe(false);
});

test('jsonString fails fast on an invalid Unicode pattern', () => {
	expect(() => jsonString({ pattern: '[' })).toThrow(SyntaxError);
	const emptyPattern = jsonString({ pattern: '' });
	for (const value of ['', 'abc', '😀', '\n']) expect(v.safeParse(emptyPattern, value).success).toBe(true);
});

test('Unicode patterns count astral characters as one and reject line terminators', () => {
	const one = jsonString({ pattern: '^.$' });
	for (const value of ['a', '😀', '\uD800']) expect(v.safeParse(one, value).success).toBe(true);
	for (const value of ['', 'aa', '😀😀', '\n', null, 42]) expect(v.safeParse(one, value).success).toBe(false);
	const bounded = jsonString({ pattern: '^.{2,3}$', minLength: 2, maxLength: 3 });
	for (const value of ['ab', 'abc', '😀😀', '😀😀😀']) expect(v.safeParse(bounded, value).success).toBe(true);
	for (const value of ['', 'a', 'abcd', '😀😀😀😀', 'a\n']) expect(v.safeParse(bounded, value).success).toBe(false);
});
