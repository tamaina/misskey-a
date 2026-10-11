/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createBillingRouter } from '../../../backend/built/features/billing/backend.js';

const alice = { id: 'alice', isSuspended: false, movedToUri: null };
const bob = { ...alice, id: 'bob' };
const chain = { chainId: 123456, name: 'Synthetic chain', confirmationsRequired: 7, isEnabled: false };
const payment = {
	id: 'order003', userId: 'alice', status: 'paid', chainId: chain.chainId,
	tokenSymbol: 'TEST', amountBaseUnits: '90071992547409931234567890', decimals: 18,
	planName: 'Synthetic plan', createdAt: 1000, paidAt: 2000,
};

function fixture({ rows = [payment], principal = alice, admin = false, root = false, token = null } = {}) {
	const calls = [];
	const catalog = new Map();
	const router = createBillingRouter({
		listPayments: async query => {
			calls.push(['read', query]);
			return rows.filter(row => row.userId === query.userId && (!query.cursor || row.id < query.cursor)).slice(0, query.limit);
		},
		listChains: async () => { calls.push(['list']); return [...catalog.values()]; },
		upsertChain: async (value, actorId) => { calls.push(['upsert', value, actorId]); catalog.set(value.chainId, { ...value }); },
	});
	const context = {
		credential: principal ? 'synthetic' : null, ip: '127.0.0.1', headers: {},
		services: {
			authenticate: async () => [principal, token], limitActor: () => null,
			rateLimitFactor: async () => 1, limit: async () => null,
		},
		authorization: {
			rootUserId: () => root ? principal?.id : null,
			roles: async () => [{ isAdministrator: admin, isModerator: true }],
			policyAllowed: async () => false,
		},
	};
	return { client: createRouterClient(router, { context }), calls, catalog };
}

test('history preserves exact amounts, strips internal fields and never writes', async () => {
	const f = fixture({ rows: [{ ...payment, payerAddress: 'internal' }, { ...payment, id: 'order002' }, { ...payment, id: 'order001', userId: 'bob' }] });
	assert.deepEqual(f.calls, []);
	const first = await f.client.listMyPayments({ limit: 1 });
	assert.equal(first.items[0].amountBaseUnits, payment.amountBaseUnits);
	assert.equal(first.items[0].status, 'paid');
	assert.equal(Object.hasOwn(first.items[0], 'payerAddress'), false);
	assert.equal(Object.hasOwn(first.items[0], 'userId'), false);
	assert.equal(first.nextCursor, 'order003');
	const second = await f.client.listMyPayments({ limit: 1, cursor: first.nextCursor });
	assert.deepEqual(second.items.map(row => row.id), ['order002']);
	assert.equal(second.nextCursor, null);
	assert.deepEqual(f.calls.map(call => call[0]), ['read', 'read']);
	assert.deepEqual(f.calls[0][1], { userId: 'alice', limit: 2 });
	assert.deepEqual(await fixture({ principal: bob }).client.listMyPayments({}), { items: [], nextCursor: null });
});

test('principal injection, unknown fields and invalid settings fail before storage', async () => {
	const f = fixture({ admin: true });
	for (const input of [{ userId: 'bob' }, { limit: 101 }, { limit: 0 }, { limit: 1.5 }, { cursor: '' }, [], null]) {
		await assert.rejects(f.client.listMyPayments(input), JSON.stringify(input));
	}
	for (const input of [{ ...chain, rpcUrl: 'https://example.test/' }, { ...chain, isEnabled: true }, { ...chain, confirmationsRequired: 0 }, { ...chain, chainId: 1.5 }, { ...chain, name: '  ' }]) {
		await assert.rejects(f.client.upsertChain(input), JSON.stringify(input));
	}
	assert.deepEqual(f.calls, []);
});

test('native policy denies anonymous, suspended, moderator and app token access', async () => {
	for (const params of [{ principal: null }, { principal: { ...alice, isSuspended: true } }, { token: { permission: ['read:account', 'write:admin:meta'] } }]) {
		const f = fixture({ ...params, admin: true });
		await assert.rejects(f.client.listMyPayments({}));
		await assert.rejects(f.client.listChains({}));
		await assert.rejects(f.client.upsertChain(chain));
		assert.deepEqual(f.calls, []);
	}
	const moderator = fixture();
	await assert.rejects(moderator.client.listChains({}));
	await assert.rejects(moderator.client.upsertChain(chain));
	assert.deepEqual(moderator.calls, []);
});

test('admin and root upserts retain one disabled identity and actor attribution on retry', async () => {
	for (const params of [{ admin: true }, { root: true }]) {
		const f = fixture(params);
		assert.deepEqual(await f.client.listChains({}), []);
		await f.client.upsertChain({ ...chain, name: '  Synthetic chain  ' });
		await f.client.upsertChain(chain);
		assert.equal(f.catalog.size, 1);
		assert.deepEqual(await f.client.listChains({}), [chain]);
		assert.equal(f.calls[1][2], alice.id);
		assert.equal(f.calls[2][2], alice.id);
	}
});

test('a misbound adapter fails closed on another owner or excess rows', async () => {
	for (const rows of [[{ ...payment, userId: 'bob' }], [payment, payment, payment]]) {
		const router = createBillingRouter({ listPayments: async () => rows });
		const client = createRouterClient(router, { context: {
			credential: 'synthetic', ip: '127.0.0.1', headers: {},
			services: { authenticate: async () => [alice, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null },
		} });
		await assert.rejects(client.listMyPayments({ limit: 1 }));
	}
});
