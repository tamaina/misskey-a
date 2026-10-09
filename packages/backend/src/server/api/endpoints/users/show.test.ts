/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, test, expect } from 'vitest';
import * as valibot from 'valibot';
import { usersShowInput } from '@features/users/backend/endpoints/users/show.contract.js';

const VALID = true;
const INVALID = false;

describe('api:users/show', () => {
	describe('validation', () => {
		const v = (input: unknown) => valibot.safeParse(usersShowInput, input).success;

		test('Reject empty', () => expect(v({})).toBe(INVALID));
		test('Reject host only', () => expect(v({ host: 'misskey.test' })).toBe(INVALID));
		test('Accept userId only', () => expect(v({ userId: '1' })).toBe(VALID));
		test('Accept username and host', () => expect(v({ username: 'alice', host: 'misskey.test' })).toBe(VALID));
	});
});
