/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { localUsernameSchema, passwordSchema, nameSchema, descriptionSchema, locationSchema, birthdaySchema } from '../../backend/user-validation.schema.js';

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
