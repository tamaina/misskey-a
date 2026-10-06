/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runTask } from '../built/backend/index.js';

test('one-shot role returns its result after closing in reverse order', async () => {
	const events = [];
	const step = name => ({ name, start() { events.push(name); return () => { events.push(`close:${name}`); }; } });
	assert.equal(await runTask([step('db'), step('events')], async () => { events.push('task'); return 42; }), 42);
	assert.deepEqual(events, ['db', 'events', 'task', 'close:events', 'close:db']);
});
test('failed acquisition rolls back and never runs the task', async () => {
	let disposed = 0;
	await assert.rejects(runTask([
		{ name: 'db', start: () => () => { disposed++; } },
		{ name: 'events', start() { throw new Error('connect failed'); } },
	], async () => assert.fail('must not run')), /connect failed/);
	assert.equal(disposed, 1);
});
test('task rejection including undefined is preserved alongside cleanup failure', async () => {
	for (const error of [undefined, new Error('task failed')]) {
		await assert.rejects(runTask([{ name: 'resource', start: () => () => { throw new Error('close failed'); } }], async () => { throw error; }), e => {
			assert.ok(e instanceof AggregateError);
			assert.equal(e.errors[0], error);
			assert.match(e.errors[1].message, /Shutdown failed/);
			return true;
		});
	}
});
test('cleanup failure prevents reporting successful completion', async () => {
	await assert.rejects(runTask([{ name: 'resource', start: () => () => { throw new Error('close failed'); } }], async () => 42), /Shutdown failed/);
});
