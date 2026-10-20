/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { UsersListsCreateContract, UsersListsCreateFromPublicContract, UsersListsUpdateContract } from '../../backend/endpoints/relationships.contract.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native schema');
	return schema;
}

const routes = [
	{ name: 'create', schema: requiredSchema(UsersListsCreateContract['~orpc'].inputSchema), fields: {} },
	{ name: 'create-from-public', schema: requiredSchema(UsersListsCreateFromPublicContract['~orpc'].inputSchema), fields: { listId: 'list123' } },
	{ name: 'update', schema: requiredSchema(UsersListsUpdateContract['~orpc'].inputSchema), fields: { listId: 'list123' } },
] as const;

const names = [
	{ label: '50 astral characters', value: '💡'.repeat(50), accepted: true },
	{ label: '51 astral characters', value: '💡'.repeat(51), accepted: true },
	{ label: '100 astral characters', value: '💡'.repeat(100), accepted: true },
	{ label: '101 astral characters', value: '💡'.repeat(101), accepted: false },
	{ label: '100 ASCII characters', value: 'a'.repeat(100), accepted: true },
	{ label: '101 ASCII characters', value: 'a'.repeat(101), accepted: false },
	{ label: '100 code points in decomposed accents', value: 'e\u0301'.repeat(50), accepted: true },
	{ label: '101 code points in decomposed accents', value: 'e\u0301'.repeat(50) + 'e', accepted: false },
	{ label: '100 code points with ZWJ sequences', value: '👩‍👩‍👧‍👦'.repeat(14) + 'aa', accepted: true },
	{ label: '101 code points with ZWJ sequences', value: '👩‍👩‍👧‍👦'.repeat(14) + 'aaa', accepted: false },
	{ label: 'empty name', value: '', accepted: false },
] as const;

for (const route of routes) {
	for (const name of names) {
		test(`${route.name}: ${name.label} preserves the Unicode code-point boundary`, () => {
			const result = v.safeParse(route.schema, { ...route.fields, name: name.value });
			expect(result.success).toBe(name.accepted);
			if (result.success) expect(result.output.name).toBe(name.value);
		});
	}
}

test('create and copy still require a name; update keeps an omitted name unchanged', () => {
	expect(v.safeParse(routes[0].schema, {}).success).toBe(false);
	expect(v.safeParse(routes[1].schema, { listId: 'list123' }).success).toBe(false);
	expect(v.parse(routes[2].schema, { listId: 'list123' })).toEqual({ listId: 'list123' });
	for (const route of routes) {
		expect(v.safeParse(route.schema, { ...route.fields, name: null }).success).toBe(false);
	}
});
