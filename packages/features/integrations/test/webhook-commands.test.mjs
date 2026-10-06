/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createWebhookCommands, legacyWebhookSchemas } from '../../../backend/built/features/integrations/backend.js';

const Ajv = createRequire(new URL('../../../backend/package.json', import.meta.url))('ajv');

const eventTypes = ['mention', 'unfollow', 'follow', 'followed', 'note', 'reply', 'renote', 'reaction'];
const inputUpdate = { webhookId: 'webhook1' };

function webhook(id = 'webhook1') {
	return { id, name: 'old name' };
}

function createDeps(overrides = {}) {
	const calls = [];
	const deps = {
		findOwnedById: async (id, userId) => { calls.push(['findOwnedById', id, userId]); return webhook(id); },
		update: async (id, values) => { calls.push(['update', id, values]); },
		findByIdOrFail: async id => { calls.push(['findByIdOrFail', id]); return webhook(id); },
		delete: async id => { calls.push(['delete', id]); },
		publishUpdated: value => { calls.push(['publishUpdated', value]); },
		publishDeleted: value => { calls.push(['publishDeleted', value]); },
		createError: definition => Object.assign(new Error(definition.message), { definition }),
		...overrides,
	};
	return { deps, calls };
}

function invoke(feature, route, input, actor = { id: 'owner' }) {
	return feature[route](input, { context: { actor } });
}

async function acceptsWebhookUpdate(values) {
	const { deps } = createDeps();
	const feature = createWebhookCommands(deps);
	try {
		await invoke(feature, 'i/webhooks/update', { ...inputUpdate, ...values });
		return true;
	} catch {
		return false;
	}
}

test('legacy schemas preserve both webhook endpoint parameter definitions', () => {
	const update = legacyWebhookSchemas['i/webhooks/update'].input;
	const object = (properties, required) => ({ type: 'object', properties, required });
	const id = { type: 'string', format: 'misskey:id' };

	assert.deepEqual(update, object({
		webhookId: id,
		name: { type: 'string', minLength: 1, maxLength: 100 },
		url: { type: 'string', minLength: 1, maxLength: 1024 },
		secret: { type: 'string', nullable: true, maxLength: 1024 },
		on: { type: 'array', items: { type: 'string', enum: eventTypes } },
		active: { type: 'boolean' },
	}, ['webhookId']));
	assert.deepEqual(legacyWebhookSchemas['i/webhooks/delete'].input, object({ webhookId: id }, ['webhookId']));
	assert.equal(JSON.stringify(update).includes('"optional":true'), false);
});

test('webhook update validation matches AJV at Unicode and secret length boundaries', async () => {
	const update = legacyWebhookSchemas['i/webhooks/update'].input;
	const ajv = new Ajv();
	const validateName = ajv.compile(update.properties.name);
	const validateSecret = ajv.compile(update.properties.secret);

	for (const [label, name, expected] of [
		['100 emoji in name', '😀'.repeat(100), true],
		['101 emoji in name', '😀'.repeat(101), false],
	]) {
		assert.equal(validateName(name), expected, `${label}: AJV`);
		assert.equal(await acceptsWebhookUpdate({ name }), expected, `${label}: endpoint`);
	}

	for (const [label, secret, expected] of [
		['1024 emoji in secret', '😀'.repeat(1024), true],
		['1025 emoji in secret', '😀'.repeat(1025), false],
	]) {
		assert.equal(validateSecret(secret), expected, `${label}: AJV`);
		assert.equal(await acceptsWebhookUpdate({ secret }), expected, `${label}: endpoint`);
	}
});

test('update scopes lookup to the trusted actor, forwards exact values, and awaits write before reload', async () => {
	const calls = [];
	let finishUpdate;
	let finishEvent;
	let startUpdate;
	const updateStarted = new Promise(resolve => { startUpdate = resolve; });
	const updated = webhook('webhook1');
	const feature = createWebhookCommands({
		findOwnedById: async (id, userId) => { calls.push(['findOwnedById', id, userId]); return webhook(id); },
		update: async (id, values) => {
			calls.push(['update:start', id, values]);
			startUpdate();
			await new Promise(resolve => { finishUpdate = resolve; });
			calls.push(['update:end']);
		},
		findByIdOrFail: async id => { calls.push(['findByIdOrFail', id]); return updated; },
		delete: async () => {},
		publishUpdated: value => {
			calls.push(['publishUpdated', value]);
			return new Promise(resolve => { finishEvent = resolve; });
		},
		publishDeleted: () => {},
		createError: definition => new Error(definition.message),
	});

	const result = invoke(feature, 'i/webhooks/update', {
		...inputUpdate,
		name: 'renamed',
		url: 'not additionally URL-validated',
		secret: null,
		on: ['follow'],
		active: false,
		actor: { id: 'spoofed' },
	}, { id: 'owner', role: 'full user object' });
	await updateStarted;
	assert.deepEqual(calls.map(call => call[0]), ['findOwnedById', 'update:start']);
	assert.deepEqual(calls[0], ['findOwnedById', 'webhook1', 'owner']);
	assert.deepEqual(calls[1], ['update:start', 'webhook1', {
		name: 'renamed',
		url: 'not additionally URL-validated',
		secret: '',
		on: ['follow'],
		active: false,
	}]);

	let settled = false;
	result.then(() => { settled = true; });
	finishUpdate();
	await result;
	assert.equal(settled, true);
	assert.deepEqual(calls.map(call => call[0]), ['findOwnedById', 'update:start', 'update:end', 'findByIdOrFail', 'publishUpdated']);
	assert.equal(calls[3][1], 'webhook1');
	assert.equal(calls[4][1], updated);
	finishEvent();
});

test('update preserves omitted optional values as undefined and accepts a null secret as the empty string', async () => {
	for (const [input, expectedSecret] of [[inputUpdate, undefined], [{ ...inputUpdate, secret: null }, '']]) {
		const { deps, calls } = createDeps();
		const feature = createWebhookCommands(deps);
		await invoke(feature, 'i/webhooks/update', input);
		assert.deepEqual(calls[1], ['update', 'webhook1', {
			name: undefined,
			url: undefined,
			secret: expectedSecret,
			on: undefined,
			active: undefined,
		}]);
	}
});

test('missing owned webhook returns the route-specific error object unchanged', async () => {
	for (const route of ['i/webhooks/update', 'i/webhooks/delete']) {
		const sentinel = Object.assign(new Error('no such webhook'), { route });
		let receivedDefinition;
		const feature = createWebhookCommands(createDeps({
			findOwnedById: async () => null,
			createError: definition => { receivedDefinition = definition; return sentinel; },
		}).deps);

		await assert.rejects(invoke(feature, route, inputUpdate), error => error === sentinel);
		assert.equal(receivedDefinition.code, 'NO_SUCH_WEBHOOK');
		assert.equal(receivedDefinition.id, route.endsWith('update')
			? 'fb0fea69-da18-45b1-828d-bd4fd1612518'
			: 'bae73e5a-5522-4965-ae19-3a8688e71d82');
	}
});

test('repository errors keep their identity and suppress later operations', async () => {
	for (const [route, failingPort] of [
		['i/webhooks/update', 'findOwnedById'],
		['i/webhooks/update', 'update'],
		['i/webhooks/update', 'findByIdOrFail'],
		['i/webhooks/delete', 'findOwnedById'],
		['i/webhooks/delete', 'delete'],
	]) {
		const sentinel = new Error(`${failingPort} failed`);
		const calls = [];
		const overrides = {
			findOwnedById: async (...args) => { calls.push('findOwnedById'); if (failingPort === 'findOwnedById') throw sentinel; return webhook(args[0]); },
			update: async () => { calls.push('update'); if (failingPort === 'update') throw sentinel; },
			findByIdOrFail: async id => { calls.push('findByIdOrFail'); if (failingPort === 'findByIdOrFail') throw sentinel; return webhook(id); },
			delete: async () => { calls.push('delete'); if (failingPort === 'delete') throw sentinel; },
			publishUpdated: () => { calls.push('publishUpdated'); },
			publishDeleted: () => { calls.push('publishDeleted'); },
		};
		const feature = createWebhookCommands(createDeps(overrides).deps);

		await assert.rejects(invoke(feature, route, inputUpdate), error => error === sentinel);
		assert.equal(calls.at(-1), failingPort);
	}
});

test('delete awaits deletion, publishes the originally loaded webhook, and does not await the event', async () => {
	const calls = [];
	const original = webhook('webhook1');
	let finishDelete;
	let finishEvent;
	let startDelete;
	const deleteStarted = new Promise(resolve => { startDelete = resolve; });
	const feature = createWebhookCommands({
		findOwnedById: async (id, userId) => { calls.push(['findOwnedById', id, userId]); return original; },
		update: async () => {},
		findByIdOrFail: async () => { throw new Error('delete must not reload'); },
		delete: async id => {
			calls.push(['delete:start', id]);
			startDelete();
			await new Promise(resolve => { finishDelete = resolve; });
			calls.push(['delete:end']);
		},
		publishUpdated: () => {},
		publishDeleted: value => {
			calls.push(['publishDeleted', value]);
			return new Promise(resolve => { finishEvent = resolve; });
		},
		createError: definition => new Error(definition.message),
	});

	const result = invoke(feature, 'i/webhooks/delete', inputUpdate);
	await deleteStarted;
	assert.deepEqual(calls.map(call => call[0]), ['findOwnedById', 'delete:start']);
	finishDelete();
	await result;
	assert.deepEqual(calls.map(call => call[0]), ['findOwnedById', 'delete:start', 'delete:end', 'publishDeleted']);
	assert.equal(calls[3][1], original);
	finishEvent();
});

test('both commands reject missing trusted actors before calling ports', async () => {
	const { deps, calls } = createDeps();
	const feature = createWebhookCommands(deps);
	for (const route of ['i/webhooks/update', 'i/webhooks/delete']) {
		await assert.rejects(feature[route](inputUpdate, { context: undefined }), /authenticated actor/);
	}
	assert.deepEqual(calls, []);
});
