/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as v from 'valibot';
import { instanceApiContract } from '../../../misskey-js/built/contracts/instance/backend/api.contract.js';
import { createGetOnlineUsersCount } from '../../../backend/built/features/instance/backend.js';

test('construction and invalid input do not read the online count or clock', async () => {
	let clockCalls = 0;
	let countCalls = 0;
	const endpoint = createGetOnlineUsersCount({ thresholdMs: 5000, countSince: async () => { countCalls++; return 7; } }, () => { clockCalls++; return 20_000; });
	assert.equal(clockCalls, 0);
	assert.equal(countCalls, 0);
	for (const input of [null, [], 'invalid', 1]) await assert.rejects(endpoint(input));
	assert.equal(clockCalls, 0);
	assert.equal(countCalls, 0);
});

test('uses the injected cutoff on each request and accepts legacy extra object fields', async () => {
	const cutoffs = [];
	const times = [20_000, 31_000];
	const counts = [3, 4];
	const endpoint = createGetOnlineUsersCount({
		thresholdMs: 5000,
		countSince: async cutoff => { cutoffs.push(cutoff); return counts[cutoffs.length - 1]; },
	}, () => times.shift());
	assert.deepEqual(await endpoint({ ignored: true }), { count: 3 });
	assert.deepEqual(await endpoint({}), { count: 4 });
	assert.deepEqual(cutoffs, [new Date(15_000), new Date(26_000)]);
});

test('count failures and invalid handler outputs propagate', async () => {
	const failure = new Error('Database read failed');
	await assert.rejects(createGetOnlineUsersCount({ thresholdMs: 1, countSince: async () => { throw failure; } }, () => 100)({}), error => error === failure);
	await assert.rejects(createGetOnlineUsersCount({ thresholdMs: 1, countSince: async () => 'invalid' }, () => 100)({}));
});

test('native contract preserves a finite numeric count', () => {
	const output = instanceApiContract.onlineUsersCount['~orpc'].outputSchema;
	assert.equal(v.safeParse(output, { count: 7 }).success, true);
	assert.equal(v.safeParse(output, { count: '7' }).success, false);
	assert.equal(v.safeParse(output, { count: Infinity }).success, false);
});
