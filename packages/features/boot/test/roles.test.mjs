/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createProcessRoles, planRoles, stopClusterWorkers } from '../../../backend/built/features/boot/backend.js';

const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const turn = () => new Promise(resolve => setImmediate(resolve));

test('role selection preserves primary/worker and flag combinations', () => {
	for (const [worker, disableClustering, onlyServer, onlyQueue, expected] of [
		[false, false, false, false, ['server']], [false, false, true, false, []],
		[false, false, false, true, ['queue']], [false, true, false, false, ['server', 'queue']],
		[false, true, true, false, ['server']], [false, true, false, true, ['queue']],
		[false, true, true, true, ['server']], [true, false, false, false, ['queue']],
		[true, false, true, false, ['server']], [true, false, false, true, ['queue']],
	]) assert.deepEqual(planRoles({ worker, disableClustering, onlyServer, onlyQueue }), expected);
});
test('all roles drain before any flush, and all flush before any close', async () => {
	const calls = [];
	const draining = deferred(); const flushing = deferred();
	const roles = createProcessRoles(['server', 'queue'], async name => {
		calls.push(`acquire:${name}`);
		return {
			async start() { calls.push(`start:${name}`); },
			async drain() { calls.push(`drain:${name}`); if (name === 'queue') await draining.promise; },
			async flush() { calls.push(`flush:${name}`); if (name === 'server') await flushing.promise; },
			async close() { calls.push(`close:${name}`); },
		};
	});
	const start = roles.start(); assert.equal(start, roles.start()); await start;
	assert.deepEqual(calls.slice(0, 4), ['acquire:server', 'acquire:queue', 'start:server', 'start:queue']);
	const stop = roles.stop(); assert.equal(stop, roles.stop()); await turn();
	assert.ok(calls.includes('drain:server')); assert.ok(calls.includes('drain:queue'));
	assert.ok(!calls.some(x => x.startsWith('flush:')));
	draining.resolve(); await turn(); assert.ok(!calls.some(x => x.startsWith('close:')));
	flushing.resolve(); await stop; assert.equal(roles.state, 'stopped');
	assert.equal(calls.filter(x => x.startsWith('close:')).length, 2);
});
test('startup failure rolls back every acquired context, including unstarted roles', async () => {
	const calls = [];
	const failure = new Error('listen failed');
	const roles = createProcessRoles(['server', 'queue'], async name => ({
		async start() { if (name === 'server') throw failure; assert.fail('queue must not start'); },
		async drain() { calls.push(`drain:${name}`); }, async flush() { calls.push(`flush:${name}`); },
		async close() { calls.push(`close:${name}`); },
	}));
	await assert.rejects(roles.start(), error => error === failure);
	await roles.stop(); assert.equal(calls.length, 6);
});
test('stop during acquisition closes the eventual context without opening admission', async () => {
	const acquired = deferred(); let closed = 0;
	const roles = createProcessRoles(['server', 'queue'], () => acquired.promise);
	const start = roles.start(); await turn(); const stop = roles.stop();
	acquired.resolve({ async start() { assert.fail('must not start'); }, async drain() {}, async flush() {}, async close() { closed++; } });
	await Promise.all([start, stop]); assert.equal(closed, 1); assert.equal(roles.state, 'stopped');
});
test('a failed phase cannot skip cleanup in another role', async () => {
	const closed = [];
	const roles = createProcessRoles(['server', 'queue'], async name => ({
		async start() {}, async drain() { if (name === 'server') throw new Error('drain failed'); },
		async flush() { if (name === 'queue') throw new Error('flush failed'); }, async close() { closed.push(name); },
	}));
	await roles.start(); await assert.rejects(roles.stop(), AggregateError);
	assert.deepEqual(closed.sort(), ['queue', 'server']);
});
test('worker shutdown signals all live children and waits for their exit', async () => {
	const children = [new EventEmitter(), new EventEmitter()]; const signals = [];
	for (const [index, child] of children.entries()) Object.assign(child, { isDead: () => false, process: { kill(signal) { signals.push([index, signal]); return true; } } });
	let done = false; const stop = stopClusterWorkers(children).then(() => { done = true; }); await turn();
	assert.deepEqual(signals, [[0, 'SIGTERM'], [1, 'SIGTERM']]); assert.equal(done, false);
	children[0].emit('exit'); await turn(); assert.equal(done, false); children[1].emit('exit'); await stop;
});
