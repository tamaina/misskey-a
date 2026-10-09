/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { createPing } from '../../../backend/built/features/instance/backend.js';
import { instanceApiContract as instanceContract } from '../../../misskey-js/built/contracts/instance/backend/api.contract.js';

test('implementation uses the contract and an injectable clock', async () => {
	const ping = createPing(() => 123);
	assert.deepEqual(await ping({}), { pong: 123 });
	assert.deepEqual(await ping(undefined), { pong: 123 });
});

test('legacy extra input properties remain accepted', async () => {
	assert.deepEqual(await createPing(() => 456)({ extra: true }), { pong: 456 });
});

test('contract rejects non-object inputs', async () => {
	for (const input of [null, 42, 'string', []]) {
		await assert.rejects(createPing()(input));
	}
});

test('contract rejects invalid handler output', async () => {
	await assert.rejects(createPing(() => 'invalid')({}));
});

test('native contract exposes the same path and validates finite output', () => {
	assert.equal(instanceContract.ping['~orpc'].route.method, 'POST');
	assert.equal(instanceContract.ping['~orpc'].route.path, '/ping');
	assert.equal(v.safeParse(instanceContract.ping['~orpc'].outputSchema, { pong: 1 }).success, true);
	assert.equal(v.safeParse(instanceContract.ping['~orpc'].outputSchema, { pong: Infinity }).success, false);
	assert.equal(v.safeParse(instanceContract.ping['~orpc'].outputSchema, { pong: 1, secret: true }).success, false);
});
