/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { packedJsonValueSchema, packedJsonObjectSchema, toPackedJsonValue, toPackedJsonObject } from '../../../misskey-js/built/contracts/users/backend/json-value.schema.js';

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
		assert.throws(() => toPackedJsonObject({ constructor: value }), TypeError);
	}
	const shared = { value: 1 };
	assert.deepEqual(v.parse(packedJsonValueSchema, { left: shared, right: shared }), { left: shared, right: shared });
	assert.deepEqual(toPackedJsonValue({ left: shared, right: shared }), { left: shared, right: shared });
});

test('stored JSON boundary validates each subtree once before copying', () => {
	for (const materialize of [toPackedJsonValue, toPackedJsonObject]) {
		let descriptorReads = 0;
		let input = { leaf: JSON.parse('{"__proto__":"retained","constructor":true,"prototype":[null,2]}') };
		const depth = 128;
		for (let i = 0; i < depth; i++) {
			input = new Proxy({ child: input }, {
				getOwnPropertyDescriptor(target, key) {
					descriptorReads++;
					return Reflect.getOwnPropertyDescriptor(target, key);
				},
			});
		}
		const output = materialize(input);
		// Object.keys checks enumerability, then one descriptor read validates and copies the value.
		assert.equal(descriptorReads, depth * 2);
		assert.deepEqual(output, input);
		assert.notEqual(output, input);
	}
});

test('stored JSON copies the validated descriptor value without invoking a differing get trap', () => {
	for (const materialize of [toPackedJsonValue, toPackedJsonObject]) {
		let getReads = 0;
		const input = new Proxy({ amount: 1 }, { get() { getReads++; return Infinity; } });
		assert.deepEqual(materialize(input), { amount: 1 });
		assert.equal(getReads, 0);
		const invalid = new Proxy({ amount: Infinity }, { get() { return 1; } });
		assert.throws(() => materialize(invalid), TypeError);
	}
});
