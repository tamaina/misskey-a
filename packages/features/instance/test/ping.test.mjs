/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPing, legacyPingSchemas } from '../built/backend/index.js';
import { instanceContract } from '../built/contract/index.js';

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

test('legacy schema is derived from the same input and output schemas', () => {
	assert.equal(legacyPingSchemas.input.type, 'object');
	assert.equal(legacyPingSchemas.output.type, 'object');
	assert.equal(legacyPingSchemas.output.properties.pong.type, 'number');
	assert.deepEqual(legacyPingSchemas.output.required, ['pong']);
	assert.equal(instanceContract.ping['~orpc'].route.method, 'POST');
	assert.equal(instanceContract.ping['~orpc'].route.path, '/ping');
});
