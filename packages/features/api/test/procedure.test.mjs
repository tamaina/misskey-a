/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { featureProcedure } from '../../../backend/built/features/api/backend.js';

const contract = oc.input(v.looseObject({ value: v.number() })).output(v.number());

test('procedure construction is inert and forwards validated input and explicit context', async () => {
	let calls = 0;
	const procedure = featureProcedure()(contract, ({ input, context }) => {
		calls++;
		assert.equal(input.extra, 'preserved');
		return input.value + context.offset;
	});
	assert.equal(calls, 0);
	assert.equal(await procedure({ value: 3, extra: 'preserved' }, { context: { offset: 4 } }), 7);
	assert.equal(calls, 1);
});

test('invalid input never invokes the handler', async () => {
	let calls = 0;
	const procedure = featureProcedure()(contract, () => { calls++; return 1; });
	await assert.rejects(procedure({ value: 'wrong' }, { context: {} }));
	assert.equal(calls, 0);
});

test('the contract validates handler output', async () => {
	const procedure = featureProcedure()(contract, () => 'wrong');
	await assert.rejects(procedure({ value: 1 }, { context: {} }));
});

test('handler failures remain observable to the existing transport', async () => {
	const expected = new Error('domain failure');
	const procedure = featureProcedure()(contract, () => { throw expected; });
	await assert.rejects(procedure({ value: 1 }, { context: {} }), error => error === expected);
});
