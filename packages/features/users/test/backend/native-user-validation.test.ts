/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { localUsernameSchema, passwordSchema, nameSchema, descriptionSchema, locationSchema, birthdaySchema } from '../../backend/user-validation.schema.js';
import { iUpdateContract } from '../../backend/endpoints/i/update.contract.js';

test('portable user credential/profile validators preserve Unicode limits and original patterns', () => {
	expect(v.safeParse(localUsernameSchema, 'user_123').success).toBe(true);
	expect(v.safeParse(localUsernameSchema, 'a'.repeat(21)).success).toBe(false);
	expect(v.safeParse(localUsernameSchema, 'hyphen-name').success).toBe(false);
	expect(v.safeParse(passwordSchema, '😀').success).toBe(true);
	expect(v.safeParse(passwordSchema, '').success).toBe(false);
	expect(v.safeParse(nameSchema, '😀'.repeat(50)).success).toBe(true);
	expect(v.safeParse(nameSchema, '😀'.repeat(51)).success).toBe(false);
	expect(v.safeParse(locationSchema, '😀'.repeat(50)).success).toBe(true);
	expect(v.safeParse(descriptionSchema, '😀'.repeat(1500)).success).toBe(true);
	expect(v.safeParse(descriptionSchema, '😀'.repeat(1501)).success).toBe(false);
	expect(v.safeParse(birthdaySchema, '2026-99-99').success).toBe(true);
	expect(v.safeParse(birthdaySchema, '2026-1-01').success).toBe(false);
	for (const input of [null, undefined, 1, [], {}]) expect(v.safeParse(nameSchema, input).success).toBe(false);
});

test('account-age approval input retains omission, null reset, zero disable and the thirty-day integer bound', () => {
	const inputSchema = iUpdateContract['~orpc'].inputSchema;
	if (inputSchema === undefined) throw new Error('Missing account update input schema');
	for (const key of ['followApprovalLocalSeconds', 'followApprovalRemoteSeconds']) {
		for (const seconds of [null, 0, 1, 43200, 2592000]) {
			expect(v.parse(inputSchema, { [key]: seconds })).toHaveProperty(key, seconds);
		}
		for (const seconds of [-1, 1.5, 2592001, Infinity, '1']) {
			expect(v.safeParse(inputSchema, { [key]: seconds }).success).toBe(false);
		}
		expect(v.parse(inputSchema, {})).not.toHaveProperty(key);
	}
});
