/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createPreferencesRouter, RegistryApiService } from '../../../backend/built/features/preferences/backend.js';

const actor = { id: 'registry-owner', isSuspended: false, movedToUri: null };
const updatedAt = new Date('2026-10-09T12:34:56.000Z');
const reservedValue = () => JSON.parse('{"__proto__":{"nested":null},"constructor":[1,true],"prototype":"saved"}');

function fixture({ token = null, overrides = {} } = {}) {
	const calls = [];
	const registry = {
		getItem: async (...args) => { calls.push(['getItem', ...args]); return { key: args[3], value: null, updatedAt }; },
		getAllItemsOfScope: async (...args) => { calls.push(['getAllItemsOfScope', ...args]); return []; },
		getAllKeysOfScope: async (...args) => { calls.push(['getAllKeysOfScope', ...args]); return []; },
		getAllScopeAndDomains: async (...args) => { calls.push(['getAllScopeAndDomains', ...args]); return []; },
		remove: async (...args) => { calls.push(['remove', ...args]); },
		set: async (...args) => { calls.push(['set', ...args]); },
		...overrides,
	};
	const router = createPreferencesRouter({ registry });
	const context = {
		credential: 'credential', ip: '192.0.2.1', headers: {},
		services: {
			authenticate: async () => [actor, token],
			limitActor: () => actor.id,
			rateLimitFactor: async () => 1,
			limit: async () => null,
		},
	};
	return { calls, client: createRouterClient(router, { context }) };
}

test('every scoped registry route uses the token tenant instead of client domain', async () => {
	const token = { id: 'trusted-token', permission: ['read:account', 'write:account'] };
	const { client, calls } = fixture({ token });
	const input = { domain: 'other-tenant', scope: ['client'], key: 'setting' };
	await client.get(input);
	await client.getDetail(input);
	await client.getAll(input);
	await client.keys(input);
	await client.keysWithType(input);
	await client.remove(input);
	await client.set({ ...input, value: null });
	assert.equal(calls.length, 7);
	for (const call of calls) {
		assert.equal(call[1], actor.id);
		assert.equal(call[2], token.id);
		assert.deepEqual(call[3], ['client']);
	}
});

test('malformed authenticated token identities fail closed before registry access', async () => {
	for (const id of [undefined, '']) {
		const { client, calls } = fixture({ token: { id, permission: ['read:account', 'write:account'] } });
		for (const method of ['get', 'getDetail', 'getAll', 'keys', 'keysWithType', 'remove', 'set']) {
			await assert.rejects(client[method]({ key: 'setting', value: null }), error => error.code === 'INTERNAL_ERROR');
		}
		assert.deepEqual(calls, []);
	}
});

test('native credentials retain default scopes and absent, null, empty, and explicit domains', async () => {
	const { client, calls } = fixture();
	await client.get({ key: 'setting' });
	await client.get({ key: 'setting', domain: null });
	await client.get({ key: 'setting', domain: '' });
	await client.get({ key: 'setting', domain: 'custom-domain' });
	assert.deepEqual(calls.map(call => [call[2], call[3]]), [[null, []], [null, []], ['', []], ['custom-domain', []]]);
});

test('JSON values and dynamic registry keys preserve reserved names through route validation', async () => {
	const value = reservedValue();
	const keys = ['__proto__', 'constructor', 'prototype'];
	const { client, calls } = fixture({ overrides: {
		getItem: async () => ({ key: '__proto__', value, updatedAt }),
		getAllItemsOfScope: async () => keys.map(key => ({ key, value, updatedAt })),
	} });
	await client.set({ key: '__proto__', value });
	assert.deepEqual(calls[0].slice(1), [actor.id, null, [], '__proto__', value]);
	assert.deepEqual(await client.get({ key: '__proto__' }), value);
	assert.deepEqual(await client.getDetail({ key: '__proto__' }), { updatedAt: updatedAt.toISOString(), value });
	const all = await client.getAll({});
	const types = await client.keysWithType({});
	assert.deepEqual(Object.keys(all), keys);
	assert.deepEqual(Object.keys(types), keys);
	for (const key of keys) {
		assert.equal(Object.hasOwn(all, key), true);
		assert.deepEqual(all[key], value);
		assert.equal(types[key], 'object');
	}
	assert.equal(Object.getPrototypeOf(all), Object.prototype);
});

test('set rejects non-JSON objects and nonfinite values before invoking storage', async () => {
	const { client, calls } = fixture();
	for (const value of [new Date(), new Map(), new Set(), NaN, Infinity, { nested: new Date() }]) {
		await assert.rejects(client.set({ key: 'setting', value }), error => error.code === 'BAD_REQUEST' && error.message === 'Input validation failed');
	}
	assert.deepEqual(calls, []);
});

test('missing reads retain endpoint-specific UUIDs and missing removes remain void', async () => {
	const { client } = fixture({ overrides: { getItem: async () => null } });
	await assert.rejects(client.get({ key: 'missing' }), error => error.code === 'NO_SUCH_KEY'
		&& error.data.id === 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a');
	await assert.rejects(client.getDetail({ key: 'missing' }), error => error.code === 'NO_SUCH_KEY'
		&& error.data.id === '97a1e8e7-c0f7-47d2-957a-92e61256e01a');
	assert.equal(await client.remove({ key: 'missing' }), undefined);
});

test('null writes are awaited and repeated writes preserve the same registry identity', async () => {
	let release;
	let started;
	let startedAgain;
	const secondStorageStarted = new Promise(resolve => { startedAgain = resolve; });
	const storageStarted = new Promise(resolve => { started = resolve; });
	const { client, calls } = fixture({ overrides: {
		set: (...args) => {
			calls.push(['set', ...args]);
			if (calls.length === 1) started();
			else startedAgain();
			return new Promise(resolve => { release = resolve; });
		},
	} });
	let settled = false;
	const pending = client.set({ key: 'setting', value: null }).then(result => { settled = true; return result; });
	await storageStarted;
	assert.equal(settled, false);
	assert.deepEqual(calls[0], ['set', actor.id, null, [], 'setting', null]);
	release();
	assert.equal(await pending, undefined);
	const repeated = client.set({ key: 'setting', value: 'updated' });
	await secondStorageStarted;
	assert.deepEqual(calls[1], ['set', actor.id, null, [], 'setting', 'updated']);
	release();
	assert.equal(await repeated, undefined);
});

test('scopes-with-domain blocks tokens before storage and native credentials read only their own scopes', async () => {
	const tokenFixture = fixture({ token: { id: 'app-token', permission: ['read:account'] } });
	await assert.rejects(tokenFixture.client.scopesWithDomain({}), error => error.code === 'ACCESS_DENIED');
	assert.deepEqual(tokenFixture.calls, []);
	const { client, calls } = fixture();
	assert.deepEqual(await client.scopesWithDomain({}), []);
	assert.deepEqual(calls, [['getAllScopeAndDomains', actor.id]]);
});

test('registry persistence binds JSON and null separately for insert and update', async () => {
	for (const existing of [null, { id: 'existing1' }]) {
		for (const value of [null, reservedValue()]) {
			const calls = [];
			const query = { where() { return this; }, andWhere() { return this; }, getOne: async () => existing };
			const repository = { createQueryBuilder: () => query, query: async (sql, params) => { calls.push([sql, params]); } };
			const events = [];
			const service = new RegistryApiService(repository, { gen: () => 'new1' }, { publishMainStream: (...args) => events.push(args) });
			await service.set(actor.id, null, ['client'], 'constructor', value);
			const [sql, params] = calls[0];
			assert.equal(calls.length, 1);
			assert.equal(sql.includes('constructor'), false);
			const stored = params[existing ? 1 : 6];
			assert.deepEqual(stored === null ? null : JSON.parse(stored), value);
			if (existing) {
				assert.ok(sql.startsWith('UPDATE "registry_item"'));
				assert.equal(params[2], 'existing1');
				assert.ok(params[0] instanceof Date);
			} else {
				assert.ok(sql.startsWith('INSERT INTO "registry_item"'));
				assert.deepEqual(params.slice(2, 6), [actor.id, null, ['client'], 'constructor']);
				assert.equal(params[0], 'new1');
				assert.ok(params[1] instanceof Date);
			}
			assert.deepEqual(events, [[actor.id, 'registryUpdated', { scope: ['client'], key: 'constructor', value }]]);
		}
	}
});

test('scope envelopes project storage-only fields while keeping scope order and null domains', async () => {
	const stored = [{ domain: null, scopes: [['first', 'second'], []], storageOnly: true }];
	const { client } = fixture({ overrides: { getAllScopeAndDomains: async () => stored } });
	const wire = await client.scopesWithDomain({});
	assert.deepEqual(wire, [{ domain: null, scopes: [['first', 'second'], []] }]);
	assert.notEqual(wire[0].scopes, stored[0].scopes);
	assert.notEqual(wire[0].scopes[0], stored[0].scopes[0]);
});
