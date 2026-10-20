/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterClient } from '@orpc/server';
import { createWalletAuthentication, createWalletRouter } from '../../../backend/built/features/billing/backend.js';

function fixture() {
	const calls = [];
	const used = new Set();
	const profile = { userId: 'alice', password: 'synthetic hash', twoFactorEnabled: true };
	const deps = {
		profiles: { findOneByOrFail: async ({ userId }) => { assert.equal(userId, 'alice'); return profile; } },
		passwordMatches: async (value, hash) => value === 'synthetic password' && hash === profile.password,
		auth: { twoFactorAuthenticate: async (p, token) => { assert.equal(p, profile); if (token !== 'synthetic OTP') throw new Error('Invalid fixture OTP'); calls.push('OTP'); } },
		passkeys: { initiateAuthentication: async userId => { calls.push(['options', userId]); return { challenge: 'synthetic challenge', rpId: 'misskey.example.test', userVerification: 'required' }; },
														verifyAuthentication: async (userId, response) => { calls.push(['passkey', userId]); if (userId !== 'alice' || response.id !== 'synthetic key' || used.has(response.id)) return false; used.add(response.id); return true; } },
	};
	return { auth: createWalletAuthentication(deps), profile, calls };
}

const password = { currentPassword: 'synthetic password', twoFactorToken: 'synthetic OTP' };

test('every begin requires explicit native password/TOTP; successful reauth is not cached', async () => {
	const f = fixture();
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { ...password, currentPassword: 'wrong' }, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { currentPassword: password.currentPassword }, 'shared-native-token'));
	await f.auth.reauthenticate('alice', password, 'shared-native-token');
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { ...password, twoFactorToken: 'wrong' }, 'shared-native-token'));
});

test('passwordless accounts require a fresh one-use native passkey on every begin', async () => {
	const f = fixture(); f.profile.password = null;
	await assert.rejects(f.auth.reauthenticate('alice', password, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { passkey: { id: 'wrong owner' } }, 'shared-native-token'));
	assert.equal((await f.auth.passkeyOptions('alice')).userVerification, 'required');
	await f.auth.reauthenticate('alice', { passkey: { id: 'synthetic key' } }, 'shared-native-token');
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { passkey: { id: 'synthetic key' } }, 'shared-native-token'));
	await assert.rejects(f.auth.reauthenticate('alice', { passkey: { id: 'synthetic key' } }, null));
});

test('two browser clients sharing native user.token cannot borrow each other reauthentication', async () => {
	const f = fixture(); const challenges = [];
	const actor = { id: 'alice', isSuspended: false, movedToUri: null };
	const router = createWalletRouter({ ...f.auth, requireResidence: async () => ({ country: 'JP', subdivision: null, revision: 1, declaredAt: 1, kind: 'self_declared' }), origin: 'https://misskey.example.test', now: () => 1000,
																																					id: () => 'synthetic wallet', nonce: () => `nonce000${challenges.length}`, chains: async () => [],
																																					rpcUrl: async () => 'https://rpc.example.test', verify: async () => false,
																																					store: { find: async () => null, insertChallenge: async value => { challenges.push(value); } },
	});
	const context = browser => ({ credential: 'same-stored-user-token', ip: '127.0.0.1', headers: { 'user-agent': browser }, services: {
		authenticate: async () => [actor, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null,
	} });
	const a = createRouterClient(router, { context: context('browser A') });
	const b = createRouterClient(router, { context: context('browser B') });
	const input = { chainId: 123456, address: '0x0000000000000000000000000000000000000001' };
	await a.begin({ ...input, ...password }); assert.equal(challenges.length, 1);
	await assert.rejects(b.begin(input), e => e.code === 'WALLET_REAUTHENTICATION_REQUIRED');
	await assert.rejects(a.begin(input), e => e.code === 'WALLET_REAUTHENTICATION_REQUIRED');
	assert.equal(challenges.length, 1);
});
