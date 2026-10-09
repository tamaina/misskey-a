/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createOperationsRouter } from '../../../backend/built/features/operations/backend.js';

const actor = { id: 'moderator', isSuspended: false, movedToUri: null };
const commands = ['Pause', 'Resume', 'Clear', 'PromoteJobs', 'RetryJob', 'RemoveJob'];
const inputFor = command => ({ queue: 'system', ...(command === 'Clear' ? { state: '*' } : command === 'RetryJob' || command === 'RemoveJob' ? { jobId: 'job-1' } : {}) });

function fixture({ principal = actor, token = null, overrides = {} } = {}) {
 const calls = [];
 const queue = Object.fromEntries(['Pause', 'Resume', 'Clear', 'PromoteJobs', 'RetryJob', 'RemoveJob'].map(command => ['queue' + command, async (...args) => { calls.push([command, ...args]); }]));
 Object.assign(queue, overrides);
 const log = { log: (me, action) => { calls.push(['log', me.id, action]); } };
 const context = {
  credential: principal ? 'credential' : null, ip: '192.0.2.1', headers: {},
  services: { authenticate: async () => [principal, token], limitActor: () => actor.id, rateLimitFactor: async () => 1, limit: async () => null },
  authorization: { rootUserId: () => actor.id, roles: async () => [], policyAllowed: async () => false },
 };
 return { calls, client: createRouterClient(createOperationsRouter({ queueService: queue, moderationLogService: log }), { context }) };
}

test('native queue commands accept every queue selector and reject invalid inputs', async () => {
 const { client, calls } = fixture();
 const queues = ['system', 'endedPollNotification', 'postScheduledNote', 'deliver', 'inbox', 'db', 'relationship', 'objectStorage', 'userWebhookDeliver', 'systemWebhookDeliver'];
 for (const command of commands) {
  for (const queue of queues) await client['adminQueue' + command]({ ...inputFor(command), queue, future: true });
  for (const bad of [{}, { queue: 'unsupported' }, [], null]) await assert.rejects(client['adminQueue' + command](bad));
 }
 assert.equal(calls.filter(call => call[0] !== 'log').length, commands.length * queues.length);
 for (const state of ['*', 'completed', 'wait', 'active', 'paused', 'prioritized', 'delayed', 'failed']) await client.adminQueueClear({ queue: 'system', state });
 await assert.rejects(client.adminQueueClear({ queue: 'system', state: 'unknown' }));
});

test('authorization and token scope reject before queue or audit side effects', async () => {
 for (const options of [{ principal: null }, { token: { permission: [] } }, { principal: { ...actor, isSuspended: true } }]) {
  const { client, calls } = fixture(options);
  await assert.rejects(client.adminQueueClear(inputFor('Clear')));
  assert.deepEqual(calls, []);
 }
});

test('pause awaits completion before audit while clear returns during background work', async () => {
 let release;
 const pending = new Promise(resolve => { release = resolve; });
 const pause = fixture({ overrides: { queuePause: () => pending } });
 let completed = false;
 const response = pause.client.adminQueuePause({ queue: 'system' }).then(() => { completed = true; });
 await Promise.resolve();
 assert.equal(completed, false);
 assert.deepEqual(pause.calls, []);
 release();
 await response;
 assert.deepEqual(pause.calls, [['log', actor.id, 'pauseQueue']]);
 let finish;
 const background = new Promise(resolve => { finish = resolve; });
 const clear = fixture({ overrides: { queueClear: () => background } });
 await clear.client.adminQueueClear(inputFor('Clear'));
 assert.deepEqual(clear.calls, [['log', actor.id, 'clearQueue']]);
 finish();
});
