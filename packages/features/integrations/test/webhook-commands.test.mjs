/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createIntegrationsRouter } from '../../../backend/built/features/integrations/backend.js';

const actor = { id: 'owner', isSuspended: false, movedToUri: null };

function fixture({ principal = actor, token = null, exists = true } = {}) {
	const calls = [];
	const webhook = { id: 'webhook1', name: 'old name' };
	const repository = {
		findOneBy: async query => { calls.push(['find', query]); return exists ? webhook : null; },
		update: async (id, values) => { calls.push(['update', id, values]); },
		findOneByOrFail: async query => { calls.push(['reload', query]); return webhook; },
		delete: async id => { calls.push(['delete', id]); },
	};
	const events = { publishInternalEvent: (name, value) => { calls.push([name, value]); return new Promise(() => {}); } };
	const dependencies = { iWebhooksUpdate: { webhooksRepository: repository, globalEventService: events }, iWebhooksDelete: { webhooksRepository: repository, globalEventService: events } };
	const context = { credential: principal ? 'credential' : null, ip: '192.0.2.1', headers: {},
																			services: { authenticate: async () => [principal, token], limitActor: () => actor.id, rateLimitFactor: async () => 1, limit: async () => null },

	};
	return { calls, webhook, client: createRouterClient(createIntegrationsRouter(dependencies), { context }) };
}

test('native update scopes ownership, strips undeclared input and clears null secret', async () => {
	const { calls, webhook, client } = fixture();
	await client.iWebhooksUpdate({ webhookId: webhook.id, name: 'new', secret: null, future: true });
	assert.deepEqual(calls[0], ['find', { id: webhook.id, userId: actor.id }]);
	assert.deepEqual(calls[1], ['update', webhook.id, { name: 'new', url: undefined, secret: '', on: undefined, active: undefined }]);
	assert.deepEqual(calls[2], ['reload', { id: webhook.id }]);
	assert.deepEqual(calls[3], ['webhookUpdated', webhook]);
});

test('delete publishes the removed webhook after its owned lookup and delete', async () => {
	const { calls, webhook, client } = fixture();
	await client.iWebhooksDelete({ webhookId: webhook.id });
	assert.deepEqual(calls, [['find', { id: webhook.id, userId: actor.id }], ['delete', webhook.id], ['webhookDeleted', webhook]]);
});

test('missing owned webhook keeps distinct endpoint UUIDs without mutation', async () => {
	for (const [method, id] of [['iWebhooksUpdate', 'fb0fea69-da18-45b1-828d-bd4fd1612518'], ['iWebhooksDelete', 'bae73e5a-5522-4965-ae19-3a8688e71d82']]) {
		const { calls, client } = fixture({ exists: false });
		await assert.rejects(client[method]({ webhookId: 'webhook1' }), error => error.code === 'NO_SUCH_WEBHOOK' && error.data.id === id);
		assert.equal(calls.length, 1);
	}
});

test('credential, token scope and finite fields reject before side effects', async () => {
	for (const options of [{ principal: null }, { token: { permission: [] } }]) {
		const { calls, client } = fixture(options);
		await assert.rejects(client.iWebhooksUpdate({ webhookId: 'webhook1' }));
		assert.deepEqual(calls, []);
	}
	for (const bad of [{}, [], { webhookId: 'webhook1', on: ['unknown'] }, { webhookId: 'webhook1', secret: 7 }]) {
		const { calls, client } = fixture();
		await assert.rejects(client.iWebhooksUpdate(bad));
		assert.deepEqual(calls, []);
	}
});
