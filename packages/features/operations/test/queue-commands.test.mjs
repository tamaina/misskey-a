/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOperations, legacyOperationsSchemas } from '../../../backend/built/features/operations/backend.js';

const commandInputs = {
	'admin/queue/pause': { queue: 'system' },
	'admin/queue/resume': { queue: 'system' },
	'admin/queue/clear': { queue: 'system', state: '*' },
	'admin/queue/promote-jobs': { queue: 'system' },
	'admin/queue/retry-job': { queue: 'system', jobId: 'job-1' },
	'admin/queue/remove-job': { queue: 'system', jobId: 'job-1' },
};

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		queuePause: async queue => { calls.push(['queuePause', queue]); },
		queueResume: async queue => { calls.push(['queueResume', queue]); },
		queueClear: async (queue, state) => { calls.push(['queueClear', queue, state]); },
		queuePromoteJobs: async queue => { calls.push(['queuePromoteJobs', queue]); },
		queueRetryJob: async (queue, jobId) => { calls.push(['queueRetryJob', queue, jobId]); },
		queueRemoveJob: async (queue, jobId) => { calls.push(['queueRemoveJob', queue, jobId]); },
		log: (actor, action) => { calls.push(['log', actor.id, action]); },
		...overrides,
	};
	return { deps, calls };
}

function invoke(feature, command, input = commandInputs[command], actor = { id: 'moderator' }, options = {}) {
	return feature[command](input, { context: options.missingContext ? undefined : { actor } });
}

test('generated legacy inputs preserve each queue endpoint schema', () => {
	const queueTypes = ['system', 'endedPollNotification', 'postScheduledNote', 'deliver', 'inbox', 'db', 'relationship', 'objectStorage', 'userWebhookDeliver', 'systemWebhookDeliver'];
	const queueSchema = { type: 'string', enum: queueTypes };
	const base = (properties, required) => ({ type: 'object', properties, required });

	assert.deepEqual(legacyOperationsSchemas['admin/queue/pause'].input, base({ queue: queueSchema }, ['queue']));
	assert.deepEqual(legacyOperationsSchemas['admin/queue/resume'].input, base({ queue: queueSchema }, ['queue']));
	assert.deepEqual(legacyOperationsSchemas['admin/queue/clear'].input, base({
		queue: queueSchema,
		state: { type: 'string', enum: ['*', 'completed', 'wait', 'active', 'paused', 'prioritized', 'delayed', 'failed'] },
	}, ['queue', 'state']));
	assert.deepEqual(legacyOperationsSchemas['admin/queue/promote-jobs'].input, base({ queue: queueSchema }, ['queue']));
	assert.deepEqual(legacyOperationsSchemas['admin/queue/retry-job'].input, base({ queue: queueSchema, jobId: { type: 'string' } }, ['queue', 'jobId']));
	assert.deepEqual(legacyOperationsSchemas['admin/queue/remove-job'].input, base({ queue: queueSchema, jobId: { type: 'string' } }, ['queue', 'jobId']));
});

test('all queue commands accept every supported queue and reject invalid enums', async () => {
	const { deps, calls } = createDeps();
	const feature = createOperations(deps);
	const queueTypes = legacyOperationsSchemas['admin/queue/pause'].input.properties.queue.enum;

	for (const [command, input] of Object.entries(commandInputs)) {
		for (const queue of queueTypes) {
			await invoke(feature, command, { ...input, queue });
		}
		await assert.rejects(async () => invoke(feature, command, { ...input, queue: 'unknownQueue' }));
	}
	await assert.rejects(async () => invoke(feature, 'admin/queue/clear', { queue: 'system', state: 'unknownState' }));

	assert.equal(calls.filter(call => call[0] !== 'log').length, queueTypes.length * Object.keys(commandInputs).length);
});

test('every operation requires a trusted context actor before calling any dependency', async () => {
	const { deps, calls } = createDeps();
	const feature = createOperations(deps);

	for (const [command, input] of Object.entries(commandInputs)) {
		await assert.rejects(async () => invoke(feature, command, { ...input, actor: { id: 'spoofed-input-actor' } }, undefined, { missingContext: true }));
		for (const actor of [null, {}, { id: '' }]) {
			await assert.rejects(async () => invoke(feature, command, { ...input, actor: { id: 'spoofed-input-actor' } }, actor));
		}
	}
	assert.deepEqual(calls, []);
});

test('input actor fields cannot spoof the trusted per-call actor, including concurrent calls', async () => {
	const pending = new Map();
	const logs = [];
	let allQueuesStarted;
	const bothStarted = new Promise(resolve => { allQueuesStarted = resolve; });
	const feature = createOperations(createDeps({
		queuePause: queue => new Promise(resolve => {
			pending.set(queue, resolve);
			if (pending.size === 2) allQueuesStarted();
		}),
		log: (actor, action) => { logs.push([actor.id, action]); },
	}).deps);

	const first = invoke(feature, 'admin/queue/pause', { queue: 'system', actor: { id: 'spoof-one' } }, { id: 'actor-one' });
	const second = invoke(feature, 'admin/queue/pause', { queue: 'db', actor: { id: 'spoof-two' } }, { id: 'actor-two' });
	await bothStarted;
	pending.get('db')();
	await second;
	pending.get('system')();
	await first;

	assert.deepEqual(logs, [['actor-two', 'pauseQueue'], ['actor-one', 'pauseQueue']]);
});

test('pause and resume await queue completion before starting an unawaited audit', async () => {
	for (const [command, queueMethod, auditAction] of [
		['admin/queue/pause', 'queuePause', 'pauseQueue'],
		['admin/queue/resume', 'queueResume', 'resumeQueue'],
	]) {
		const events = [];
		let finishQueue;
		let finishAudit;
		let notifyQueueStarted;
		const queueStarted = new Promise(resolve => { notifyQueueStarted = resolve; });
		const feature = createOperations(createDeps({
			[queueMethod]: async () => {
				events.push('queue-start');
				notifyQueueStarted();
				await new Promise(resolve => { finishQueue = resolve; });
				events.push('queue-finish');
			},
			log: (_actor, action) => {
				events.push(`audit-start:${action}`);
				return new Promise(resolve => { finishAudit = resolve; });
			},
		}).deps);

		let settled = false;
		const result = invoke(feature, command).then(() => { settled = true; });
		await queueStarted;
		assert.deepEqual(events, ['queue-start']);
		finishQueue();
		await result;
		assert.equal(settled, true);
		assert.deepEqual(events, ['queue-start', 'queue-finish', `audit-start:${auditAction}`]);
		finishAudit();
	}
});

test('clear and promote call queue then audit without waiting for either promise', async () => {
	for (const [command, queueMethod, auditAction] of [
		['admin/queue/clear', 'queueClear', 'clearQueue'],
		['admin/queue/promote-jobs', 'queuePromoteJobs', 'promoteQueue'],
	]) {
		const events = [];
		const never = new Promise(() => {});
		const feature = createOperations(createDeps({
			[queueMethod]: () => { events.push('queue'); return never; },
			log: (_actor, action) => { events.push(`audit:${action}`); return never; },
		}).deps);

		await invoke(feature, command);
		assert.deepEqual(events, ['queue', `audit:${auditAction}`]);
	}
});

test('queue failures suppress pause/resume audits and retry/remove never audit', async () => {
	const events = [];
	const failed = Promise.reject(new Error('queue failed'));
	failed.catch(() => {});
	const feature = createOperations(createDeps({
		queuePause: () => failed,
		queueResume: () => failed,
		queueRetryJob: () => { events.push('retry'); return Promise.resolve(); },
		queueRemoveJob: () => { events.push('remove'); return Promise.resolve(); },
		log: (_actor, action) => { events.push(`audit:${action}`); },
	}).deps);

	await assert.rejects(invoke(feature, 'admin/queue/pause'), /queue failed/);
	await assert.rejects(invoke(feature, 'admin/queue/resume'), /queue failed/);
	await invoke(feature, 'admin/queue/retry-job');
	await invoke(feature, 'admin/queue/remove-job');
	assert.deepEqual(events, ['retry', 'remove']);
});
