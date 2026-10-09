/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { birthdaySelectorSchema, readBirthdayDate } from '@features/relationships/backend/endpoints/birthday.schema.js';

const dates = [{ month: 1, day: 2 }, { month: 2, day: 31 }, { month: 12, day: 31, extra: 1 }];
test.each(dates)('birthday accepts a valid date: %j', input => {
 expect(v.safeParse(birthdaySelectorSchema, input).success).toBe(true);
 expect(v.safeParse(birthdaySelectorSchema, { begin: input, end: { month: 1, day: 1 } }).success).toBe(true);
});
test.each([null, [], {}, { month: 0, day: 1 }, { month: 1.5, day: 2 }, { begin: { month: 1, day: 1 } }, { month: Infinity, day: 1 }, { month: 1, day: 2, begin: { month: 1, day: 1 }, end: { month: 1, day: 1 } }])('birthday rejects invalid or simultaneously valid alternatives: %j', input => {
 expect(v.safeParse(birthdaySelectorSchema, input).success).toBe(false);
});
test('birthday preserves known inactive fields without mutating input', () => {
 const input = { month: 1, day: 2, begin: null, end: null, future: true };
 expect(v.parse(birthdaySelectorSchema, input)).toEqual({ month: 1, day: 2, begin: null, end: null });
 expect(input.future).toBe(true);
 expect(readBirthdayDate({ month: 0, day: -1 })).toEqual({ month: 0, day: -1 });
 for (const value of [null, [], {}, { month: 1, day: '2' }]) expect(() => readBirthdayDate(value)).toThrow(TypeError);
});
