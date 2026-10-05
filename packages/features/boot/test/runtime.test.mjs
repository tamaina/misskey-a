/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime } from '../built/backend/index.js';

const step = (name, events) => ({ name, start() { events.push(`start:${name}`); return () => { events.push(`stop:${name}`); }; } });

test('registration is inert, start is shared, stop is reverse-order and shared', async () => {
	const events = [];
	const runtime = createRuntime([step('database', events), step('listener', events)]);
	assert.equal(runtime.state, 'idle');
	assert.deepEqual(events, []);
	const starting = runtime.start();
	assert.equal(runtime.start(), starting);
	await starting;
	assert.equal(runtime.state, 'ready');
	const stopping = runtime.stop();
	assert.equal(runtime.stop(), stopping);
	await stopping;
	assert.equal(runtime.state, 'stopped');
	assert.deepEqual(events, ['start:database', 'start:listener', 'stop:listener', 'stop:database']);
	await assert.rejects(runtime.start(), /stopped/);
});

test('startup failure rolls back acquired resources, does not start later steps', async () => {
	const events = [];
	const failure = new Error('listen failed');
	const runtime = createRuntime([step('db', events), { name: 'http', start() { throw failure; } }, step('daemon', events)]);
	await assert.rejects(runtime.start(), error => error === failure);
	assert.equal(runtime.state, 'failed');
	assert.deepEqual(events, ['start:db', 'stop:db']);
	await runtime.stop();
	assert.deepEqual(events, ['start:db', 'stop:db']);
});

test('cleanup failures do not prevent closing earlier resources', async () => {
	const events = [];
	const runtime = createRuntime([step('db', events), { name: 'http', start() { return () => { throw new Error('close failed'); }; } }]);
	await runtime.start();
	await assert.rejects(runtime.stop(), AggregateError);
	assert.deepEqual(events, ['start:db', 'stop:db']);
	assert.equal(runtime.state, 'failed');
});

test('rollback preserves both original and cleanup errors', async () => {
	const original = new Error('start failed');
	const runtime = createRuntime([
		{ name: 'db', start() { return () => { throw new Error('close failed'); }; } },
		{ name: 'http', start() { throw original; } },
	]);
	await assert.rejects(runtime.start(), error => error instanceof AggregateError && error.errors[0] === original && error.errors.length === 2);
});

test('stop during startup waits for acquisition, skips later steps and closes once', async () => {
	const events = [];
	let acquired;
	const pending = new Promise(resolve => { acquired = resolve; });
	const runtime = createRuntime([{ name: 'db', start: () => pending }, step('http', events)]);
	const start = runtime.start();
	await Promise.resolve();
	const stop = runtime.stop();
	acquired(() => { events.push('stop:db'); });
	await Promise.all([start, stop]);
	assert.equal(runtime.state, 'stopped');
	assert.deepEqual(events, ['stop:db']);
});

test('stop before start is terminal without side effects', async () => {
	const events = [];
	const runtime = createRuntime([step('db', events)]);
	await runtime.stop();
	await assert.rejects(runtime.start(), /stopped/);
	assert.deepEqual(events, []);
});

test('each role owns its resources independently', async () => {
	const events = [];
	const server = createRuntime([step('server', events)]);
	const queue = createRuntime([step('queue', events)]);
	await server.start();
	await queue.start();
	await server.stop();
	assert.equal(queue.state, 'ready');
	await queue.stop();
});

test('duplicate names fail before any side effects', () => {
	const events = [];
	assert.throws(() => createRuntime([step('db', events), step('db', events)]), /Duplicate/);
	assert.deepEqual(events, []);
});
