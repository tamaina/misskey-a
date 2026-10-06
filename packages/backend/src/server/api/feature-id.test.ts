/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { misskeyId, misskeyIdPattern } from '@features/api/contract';
import { toLegacyJsonSchema } from '@features/api/backend';

test('portable identifiers preserve the existing format validator', () => {
	for (const value of ['abc123', 'ABC', '0', '', 'a-b', 'a/b', 'a\n', 1, null, {}, []]) {
		const legacy = typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value);
		expect(v.safeParse(misskeyId, value).success).toBe(legacy);
		if (typeof value === 'string') expect(misskeyIdPattern.test(value)).toBe(legacy);
	}
});

test('portable identifiers retain the existing legacy schema format', () => {
	expect(toLegacyJsonSchema(v.looseObject({ id: misskeyId }))).toEqual({
		type: 'object',
		properties: { id: { type: 'string', format: 'misskey:id' } },
		required: ['id'],
	});
});
