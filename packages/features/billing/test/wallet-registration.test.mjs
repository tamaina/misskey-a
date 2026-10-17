/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createWalletRouter, createWalletProof, WALLET_CHALLENGE_TTL } from '../../../backend/built/features/billing/backend.js';

const actor = { id: 'alice', isSuspended: false, movedToUri: null };
const address = '0x0000000000000000000000000000000000000001';
const chain = { chainId: 123456, name: 'Synthetic chain', nativeCurrencyName: 'Synthetic coin', nativeCurrencySymbol: 'TEST', nativeCurrencyDecimals: 18, blockExplorerUrl: null };
const input = { chainId: chain.chainId, address, currentPassword: 'synthetic fixture' };
const signature = '0x1234'; // Synthetic verifier fixture, never generated with a private key.

function fixture({ principal = actor, permission = null, valid = true, reauth = true, rpc = true } = {}) {
	let now = Date.UTC(2026, 9, 11);
	let counter = 0;
	const wallets = new Map();
	const challenges = new Map();
	const calls = [];
	const deps = {
		origin: 'https://misskey.example.test', id: () => `wallet-${++counter}`, now: () => now, nonce: () => `nonce000${++counter}`,
		reauthenticate: async userId => { calls.push(['auth', userId]); if (!reauth) throw new Error('Sensitive auth failed'); },
		chains: async () => [chain], rpcUrl: async () => rpc ? 'https://rpc.example.test' : null,
		verify: async challenge => { calls.push(['verify', challenge]); return valid; },
		store: {
			list: async userId => [...wallets.values()].filter(wallet => wallet.userId === userId),
			find: async (chainId, address) => [...wallets.values()].find(wallet => wallet.chainId === chainId && wallet.address === address) ?? null,
			insertChallenge: async value => { assert.ok(!challenges.has(value.nonce)); challenges.set(value.nonce, { ...value }); },
			getChallenge: async (nonce, userId) => { const c = challenges.get(nonce); return c?.userId === userId ? { ...c } : null; },
			complete: async (challenge, wallet, time) => {
				// Atomic synthetic transaction. Real database locking/rollback is an unimplemented adapter requirement.
				const c = challenges.get(challenge.nonce);
				if (!c || c.userId !== wallet.userId || c.message !== challenge.message || c.usedAt !== null || c.expiresAt <= time) return null;
				if ([...wallets.values()].some(w => w.chainId === wallet.chainId && w.address === wallet.address)) return null;
				wallets.set(wallet.id, { ...wallet }); c.usedAt = time;
				return wallet;
			},
			unlink: async (id, userId) => wallets.get(id)?.userId === userId && wallets.delete(id),
		},
	};
	const context = { credential: principal ? 'synthetic' : null, ip: '127.0.0.1', headers: { host: 'untrusted.example.test' }, services: {
		authenticate: async () => [principal, permission === null ? null : { permission }], limitActor: () => null,
		rateLimitFactor: async () => 1, limit: async () => null,
	} };
	return { deps, wallets, challenges, calls, tick: delta => { now += delta; }, client: () => createRouterClient(createWalletRouter(deps), { context }) };
}

async function begin(f) { return f.client().begin(input); }

async function verify(f, challenge) { return f.client().verify({ ...challenge, signature }); }

test('source SIWE fields, TTL, canonical origin and normalized unique identity; no internal fields', async () => {
	const f = fixture(); const c = await begin(f);
	assert.match(c.message, /^misskey.example.test wants you to sign in/);
	assert.match(c.message, /URI: https:\/\/misskey.example.test\nVersion: 1\nChain ID: 123456/);
	assert.match(c.message, /Link this wallet to your Misskey 9000 account\./);
	assert.match(c.message, /Expiration Time: 2026-10-11T00:10:00.000Z/);
	assert.equal(f.challenges.get(c.nonce).expiresAt - f.challenges.get(c.nonce).createdAt, WALLET_CHALLENGE_TTL);
	const wallet = await verify(f, c);
	assert.equal(wallet.address, address);
	assert.equal(Object.hasOwn(wallet, 'userId'), false);
	assert.equal(Object.hasOwn(wallet, 'signature'), false);
	assert.deepEqual(await f.client().list({}), [wallet]);
	await assert.rejects(begin(f), { code: 'WALLET_ALREADY_LINKED' });
	await assert.rejects(verify(f, c));
	assert.equal(f.wallets.size, 1);
});

test('replay, wrong account, message tamper, domain drift and exact expiry fail before verification', async () => {
	for (const mode of ['account', 'nonce', 'message', 'domain', 'uri', 'expired', 'used']) {
		const f = fixture(); const c = await begin(f); const stored = f.challenges.get(c.nonce);
		if (mode === 'account') stored.userId = 'bob';
		if (mode === 'nonce') stored.nonce = 'different0001';
		if (mode === 'message') c.message += 'tamper';
		if (mode === 'domain') stored.domain = 'wrong.example.test';
		if (mode === 'uri') stored.uri = 'https://wrong.example.test';
		if (mode === 'expired') f.tick(WALLET_CHALLENGE_TTL);
		if (mode === 'used') stored.usedAt = 1;
		await assert.rejects(verify(f, c), { code: 'WALLET_CHALLENGE_NOT_FOUND' });
		assert.equal(f.wallets.size, 0);
		assert.equal(f.calls.filter(call => call[0] === 'verify').length, 0);
	}
});

test('false signature, verifier error and expiry during RPC leave challenge unconsumed', async () => {
	for (const mode of ['false', 'throw', 'expired']) {
		const f = fixture({ valid: mode !== 'false' }); const c = await begin(f);
		if (mode === 'throw') f.deps.verify = async () => { throw new Error('RPC failure'); };
		if (mode === 'expired') f.deps.verify = async () => { f.tick(WALLET_CHALLENGE_TTL); return true; };
		await assert.rejects(verify(f, c));
		assert.equal(f.wallets.size, 0); assert.equal(f.challenges.get(c.nonce).usedAt, null);
	}
});

test('concurrent completion wins once; failed transaction does not consume proof', async () => {
	const f = fixture(); const c = await begin(f);
	const result = await Promise.allSettled([verify(f, c), verify(f, c)]);
	assert.equal(result.filter(value => value.status === 'fulfilled').length, 1);
	assert.equal(f.wallets.size, 1);
	const other = fixture(); const challenge = await begin(other);
	const complete = other.deps.store.complete;
	other.deps.store.complete = async () => { throw new Error('Synthetic rollback'); };
	await assert.rejects(verify(other, challenge));
	assert.equal(other.challenges.get(challenge.nonce).usedAt, null); assert.equal(other.wallets.size, 0);
	other.deps.store.complete = complete; await verify(other, challenge);
});

test('global chain/address uniqueness, own unlink and fresh relink; same address on another chain is distinct', async () => {
	const f = fixture(); const c = await begin(f); const w = await verify(f, c);
	f.wallets.set(w.id, { ...f.wallets.get(w.id), userId: 'bob' });
	assert.deepEqual(await f.client().list({}), []);
	await assert.rejects(f.client().unlink({ walletId: w.id }), { code: 'WALLET_NOT_FOUND' });
	await assert.rejects(begin(f), { code: 'WALLET_ALREADY_LINKED' });
	f.wallets.set(w.id, { ...f.wallets.get(w.id), userId: 'alice' });
	await f.client().unlink({ walletId: w.id });
	await assert.rejects(verify(f, c));
	const fresh = await begin(f); await verify(f, fresh);
	const second = await f.client().begin({ ...input, chainId: 123457 }); await verify(f, second);
	assert.equal(f.wallets.size, 2);
});

test('read/write permission kinds support explicitly scoped app tokens and reject unscoped/anonymous/suspended callers', async () => {
	const reader = fixture({ permission: ['read:account'] }); await reader.client().list({}); await reader.client().chains({});
	await assert.rejects(begin(reader)); assert.deepEqual(reader.calls, []);
	const writer = fixture({ permission: ['write:account'] }); await begin(writer);
	await assert.rejects(writer.client().list({}));
	for (const params of [{ principal: null }, { principal: { ...actor, isSuspended: true } }, { permission: [] }]) {
		const f = fixture(params); await assert.rejects(begin(f)); await assert.rejects(f.client().list({})); assert.deepEqual(f.calls, []);
	}
});

test('reauth, unknown fields and unsupported chain fail before challenge storage', async () => {
	for (const params of [{ reauth: false }, { rpc: false }]) {
		const f = fixture(params); await assert.rejects(begin(f)); assert.equal(f.challenges.size, 0);
	}
	const f = fixture();
	for (const value of [{ ...input, userId: 'bob' }, { ...input, chainId: 0 }, { ...input, address: 'not-an-address' }]) await assert.rejects(f.client().begin(value));
	for (const value of [[], null, { userId: 'bob' }]) await assert.rejects(f.client().list(value));
	assert.deepEqual(f.calls, []);
	f.deps.store.list = async () => [{ id: 'wallet', userId: 'bob' }];
	await assert.rejects(f.client().list({}));
});

test('actual viem verifier rejects a domain mismatch before any RPC or signing', async () => {
	const f = fixture(); const c = await begin(f);
	const challenge = { ...f.challenges.get(c.nonce), domain: 'wrong.example.test' };
	assert.equal(await createWalletProof({ send: async () => { throw new Error('Unexpected synthetic RPC'); } }).verify(challenge, signature, 'https://rpc.example.test', f.deps.now()), false);
});
