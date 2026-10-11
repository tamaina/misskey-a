/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createWalletRouter } from '../../../backend/built/features/billing/backend.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const chain = { chainId: 123456, name: 'Synthetic', nativeCurrencyName: 'Coin', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null, isEnabled: true };

function fixture({ principal = actor, admin = true, token = null, fails = false } = {}) {
	const calls = [];
	const chainSettings = {
		listSettings: async () => [{ ...chain, hasRpc: true }],
		upsertSettings: async (input, actorId) => {
			calls.push([input, actorId]);
			if (fails) throw new Error('SQL parameter contains synthetic-private-token');
			const metadata = { ...input };
			delete metadata.rpcUrl;
			return { ...metadata, hasRpc: true };
		},
	};
	const router = createWalletRouter({ origin: 'https://misskey.example.test', chainSettings });
	const context = { credential: principal ? 'synthetic' : null, ip: '127.0.0.1', headers: {}, services: {
		authenticate: async () => [principal, token], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null,
	}, authorization: { rootUserId: () => null, roles: async () => [{ isAdministrator: admin, isModerator: true }], policyAllowed: async () => false } };
	return { calls, client: createRouterClient(router, { context }) };
}

test('native chain settings require administrator and scoped app-token permissions', async () => {
	for (const options of [{ principal: null }, { principal: { ...actor, isSuspended: true } }, { admin: false }, { token: { permission: ['read:account', 'write:account'] } }]) {
		const f = fixture(options);
		await assert.rejects(f.client.listChainSettings({}));
		await assert.rejects(f.client.upsertChainSettings(chain));
		assert.deepEqual(f.calls, []);
	}
	const reader = fixture({ token: { permission: ['read:admin:meta'] } });
	assert.deepEqual(await reader.client.listChainSettings({}), [{ ...chain, hasRpc: true }]);
	await assert.rejects(reader.client.upsertChainSettings(chain));
	const writer = fixture({ token: { permission: ['write:admin:meta'] } });
	assert.deepEqual(await writer.client.upsertChainSettings({ ...chain, rpcUrl: 'https://rpc.example.test' }), { ...chain, hasRpc: true });
	assert.equal(writer.calls[0][1], actor.id);
});

test('strict operational input rejects actor injection, unsafe chain IDs and non-HTTPS RPC before storage', async () => {
	const f = fixture();
	for (const input of [{ ...chain, actorId: 'bob' }, { ...chain, chainId: Number.MAX_SAFE_INTEGER + 1 }, { ...chain, rpcUrl: 'http://rpc.example.test' }, { ...chain, rpcUrl: 'not a URL' }, { ...chain, price: '1' }]) await assert.rejects(f.client.upsertChainSettings(input), error => error.code === 'BAD_REQUEST' || error.code === 'INVALID_PARAM');
	assert.deepEqual(f.calls, []);
});

test('admin response and driver failures never return RPC credentials', async () => {
	const f = fixture();
	assert.equal(JSON.stringify(await f.client.upsertChainSettings({ ...chain, rpcUrl: 'https://synthetic-private-token@rpc.example.test' })).includes('synthetic-private-token'), false);
	await assert.rejects(fixture({ fails: true }).client.upsertChainSettings(chain), error => !JSON.stringify(error).includes('synthetic-private-token') && !error.message.includes('synthetic-private-token'));
});
