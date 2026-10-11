/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWalletAuthentication, WALLET_RECENT_AUTH_SECONDS } from '../../../backend/built/features/billing/backend.js';

function fixture() {
	let now = 0;
	const cache = new Map();
	const calls = [];
	const profile = { userId: 'alice', password: 'synthetic hash', twoFactorEnabled: true };
	const deps = {
		profiles: { findOneByOrFail: async ({ userId }) => { assert.equal(userId, 'alice'); return profile; } },
		passwordMatches: async (value, hash) => value === 'synthetic password' && hash === profile.password,
		auth: { twoFactorAuthenticate: async (p, token) => { assert.equal(p, profile); if (token !== 'synthetic OTP') throw new Error('Invalid fixture OTP'); calls.push('OTP'); } },
		passkeys: { initiateAuthentication: async userId => { calls.push(['options', userId]); return { challenge: 'synthetic challenge', rpId: 'misskey.example.test', userVerification: 'required' }; },
			verifyAuthentication: async (userId, response) => { calls.push(['passkey', userId]); return userId === 'alice' && response.id === 'synthetic key'; } },
		recent: { get: async key => { const c = cache.get(key); return c && c.expires > now ? c.value : null; },
			setex: async (key, seconds, value) => { assert.equal(seconds, 300); assert.ok(!key.includes('fixture-token')); cache.set(key, { value, expires: now + seconds * 1000 }); } },
	};
	return { auth: createWalletAuthentication(deps), profile, cache, calls, tick: value => { now += value; } };
}

const password = { currentPassword: 'synthetic password', twoFactorToken: 'synthetic OTP' };

test('native password/TOTP recent proof is bounded and bound to the current credential', async () => {
	const f = fixture();
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'fixture-token-a'));
	await assert.rejects(f.auth.reauthenticate('alice', { ...password, currentPassword: 'wrong' }, 'fixture-token-a'));
	await assert.rejects(f.auth.reauthenticate('alice', { currentPassword: password.currentPassword }, 'fixture-token-a'));
	assert.equal(f.cache.size, 0);
	await f.auth.reauthenticate('alice', password, 'fixture-token-a');
	await f.auth.reauthenticate('alice', {}, 'fixture-token-a');
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'fixture-token-b'));
	await assert.rejects(f.auth.reauthenticate('alice', { ...password, twoFactorToken: 'wrong' }, 'fixture-token-a'));
	f.tick(WALLET_RECENT_AUTH_SECONDS * 1000);
	await assert.rejects(f.auth.reauthenticate('alice', {}, 'fixture-token-a'));
});

test('passwordless accounts use a verified native passkey; failure never establishes recent auth', async () => {
	const f = fixture(); f.profile.password = null;
	await assert.rejects(f.auth.reauthenticate('alice', password, 'fixture-token-a'));
	await assert.rejects(f.auth.reauthenticate('alice', { passkey: { id: 'wrong owner' } }, 'fixture-token-a'));
	assert.equal(f.cache.size, 0);
	assert.equal((await f.auth.passkeyOptions('alice')).userVerification, 'required');
	await f.auth.reauthenticate('alice', { passkey: { id: 'synthetic key' } }, 'fixture-token-a');
	await f.auth.reauthenticate('alice', {}, 'fixture-token-a');
	await assert.rejects(f.auth.reauthenticate('bob', {}, 'fixture-token-a'));
	await assert.rejects(f.auth.reauthenticate('alice', { passkey: { id: 'synthetic key' } }, null));
});
