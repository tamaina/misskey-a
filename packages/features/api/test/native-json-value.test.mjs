/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { packedJsonValueSchema, packedJsonObjectSchema, toPackedJsonValue } from '../../../misskey-js/built/contracts/users/backend/json-value.schema.js';

test('genuine JSON retains reserved own business keys without prototype changes', () => {
	const input = JSON.parse('{"__proto__":{"enabled":true},"constructor":"business","prototype":[null,2]}');
	for (const schema of [packedJsonValueSchema, packedJsonObjectSchema]) {
		const output = v.parse(schema, input);
		assert.deepEqual(output, input);
		assert.equal(Object.getPrototypeOf(output), Object.prototype);
		assert.equal(Object.hasOwn(output, '__proto__'), true);
	}
});

test('native, nonfinite and cyclic values fail before JSON record projection', () => {
	const cycle = {}; cycle.self = cycle;
	const array = []; array.push(array);
	for (const value of [undefined, () => 1, NaN, Infinity, new Date(), new Map(), cycle, array]) {
		assert.equal(v.safeParse(packedJsonValueSchema, value).success, false);
		assert.equal(v.safeParse(packedJsonValueSchema, { constructor: value }).success, false);
		assert.throws(() => toPackedJsonValue(value), TypeError);
	}
	const shared = { value: 1 };
	assert.deepEqual(v.parse(packedJsonValueSchema, { left: shared, right: shared }), { left: shared, right: shared });
});
