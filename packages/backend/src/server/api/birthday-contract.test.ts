/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { readBirthdayDate } from '@features/relationships/backend/endpoints/birthday.schema.js';
import { relationshipsContract } from '@features/relationships/backend/endpoints/relationships.contract.js';

function requiredSchema<S extends v.GenericSchema>(value: S | undefined): S {
	if (value === undefined) throw new Error('Missing native birthday input schema');
	return value;
}

const schema = requiredSchema(relationshipsContract['users/get-following-users-by-birthday']['~orpc'].inputSchema);

function validBirthday(value: unknown) { return v.safeParse(schema, { birthday: value }).success; }

function parseBirthday(value: unknown) { return v.parse(schema, { birthday: value }).birthday; }

const dates = [{ month: 1, day: 2 }, { month: 2, day: 31 }, { month: 12, day: 31, extra: 1 }];
test.each(dates)('birthday accepts a valid date: %j', input => {
 expect(validBirthday(input)).toBe(true);
 expect(validBirthday({ begin: input, end: { month: 1, day: 1 } })).toBe(true);
});
test.each([null, [], {}, { month: 0, day: 1 }, { month: 1.5, day: 2 }, { begin: { month: 1, day: 1 } }, { month: Infinity, day: 1 }, { month: 1, day: 2, begin: { month: 1, day: 1 }, end: { month: 1, day: 1 } }])('birthday rejects invalid or simultaneously valid alternatives: %j', input => {
 expect(validBirthday(input)).toBe(false);
});
test('birthday preserves known inactive fields without mutating input', () => {
 const input = { month: 1, day: 2, begin: null, end: null, future: true };
 expect(parseBirthday(input)).toEqual({ month: 1, day: 2, begin: null, end: null });
 expect(input.future).toBe(true);
 expect(readBirthdayDate({ month: 0, day: -1 })).toEqual({ month: 0, day: -1 });
 for (const value of [null, [], {}, { month: 1, day: '2' }]) expect(() => readBirthdayDate(value)).toThrow(TypeError);
});
