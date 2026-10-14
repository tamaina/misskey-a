/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { beforeEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as webauthn from '@simplewebauthn/server';
import { FreshPasskeyReauthentication, freshReauthenticationPolicyStamp } from '../../backend/fresh-passkey-reauthentication.js';
import type { FreshReauthenticationRecord } from '../../backend/fresh-reauthentication-store.js';
import type { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import type { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';
import { normalizedPasskeyPublicKey } from '../../backend/passkey-public-key.js';

vi.mock('@simplewebauthn/server', async original => ({
	...await original<typeof import('@simplewebauthn/server')>(), verifyAuthenticationResponse: vi.fn(),
}));
const identity = { userId: 'synthetic-user', browserSession: { userId: 'synthetic-user', id: 'synthetic-session' } };
const purpose = 'activate-passkey-mfa' as const;
const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID', userHandle: 'AQID' }, clientExtensionResults: {} };

function fixture() {
	const deps = mockDeep<{
		store: ConstructorParameters<typeof FreshPasskeyReauthentication>[0];
		sessions: ConstructorParameters<typeof FreshPasskeyReauthentication>[1];
		profiles: ConstructorParameters<typeof FreshPasskeyReauthentication>[2];
		keys: ConstructorParameters<typeof FreshPasskeyReauthentication>[3];
	}>();
	const profile = { userId: identity.userId, password: bcrypt.hashSync('synthetic-password', 4), twoFactorEnabled: false, twoFactorSecret: null, passkeyMfaEnabled: false };
	const key = { id: 'AQID', userId: identity.userId, publicKey: 'AQID', counter: 1, transports: ['usb'] };
	deps.profiles.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ ...profile }));
	deps.keys.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>(key)]);
	deps.keys.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
	deps.sessions.isActive.mockResolvedValue(true);
	deps.store.startDeadline.mockResolvedValue(1_800_000_000_000);
	let row: FreshReauthenticationRecord | undefined;
	deps.store.create.mockImplementation(async value => { row = value; return 'x'.repeat(43); });
	deps.store.consume.mockImplementation(async () => { const value = row; row = undefined; return value ? { record: value, remainingMs: 90_000 } : null; });
	const service = new FreshPasskeyReauthentication(deps.store, deps.sessions, deps.profiles, deps.keys, { url: 'https://synthetic.example', hostname: 'synthetic.example' });
	return { ...deps, profile, key, service };
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 2, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } });
});

test('password-first real generator binds a dedicated required-UV challenge; result is metadata only', async () => {
	const f = fixture();
	const started = await f.service.begin(identity, purpose, 'synthetic-password');
	expect(started.options).toMatchObject({ rpId: 'synthetic.example', userVerification: 'required', allowCredentials: [{ id: 'AQID', type: 'public-key', transports: ['usb'] }] });
	expect(f.store.create).toHaveBeenCalledWith({ userId: identity.userId, sessionId: identity.browserSession.id, purpose, policyStamp: expect.stringMatching(/^[a-f0-9]{64}$/), challenge: started.options.challenge }, expect.any(Number));
	expect(f.store.create.mock.calls[0][1]).toBe(1_800_000_000_000);
	expect(await f.service.complete(identity, purpose, started.ticket, assertion)).toEqual({ userId: identity.userId, sessionId: identity.browserSession.id, purpose, policyStamp: expect.any(String), expiresAtMonotonic: expect.any(Number) });
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: true, expectedChallenge: started.options.challenge, expectedOrigin: 'https://synthetic.example', expectedRPID: 'synthetic.example', credential: expect.objectContaining({ id: 'AQID', counter: 1 }) }));
	expect(f.keys.update).toHaveBeenCalledWith({ id: 'AQID', userId: identity.userId, publicKey: 'AQID', counter: 1 }, expect.objectContaining({ counter: 2 }));
	await expect(f.service.complete(identity, purpose, started.ticket, assertion)).rejects.toThrow();
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
});

test.each([
	{ userId: identity.userId }, { ...identity, browserSession: { ...identity.browserSession, userId: 'other' } },
	{ ...identity, accessToken: {} },
])('legacy/OAuth or mismatched session cannot create or complete fresh auth (%j)', async bad => {
	const f = fixture();
	await expect(f.service.begin(bad, purpose, 'synthetic-password')).rejects.toThrow();
	await expect(f.service.complete(bad, purpose, 'x'.repeat(43), assertion)).rejects.toThrow();
	expect(f.profiles.findOneByOrFail).not.toHaveBeenCalled();
	expect(f.store.consume).not.toHaveBeenCalled();
});

test('revoked session, wrong password and absent key cannot create a challenge', async () => {
	const f = fixture();
	f.sessions.isActive.mockResolvedValue(false);
	await expect(f.service.begin(identity, purpose, 'synthetic-password')).rejects.toThrow();
	f.sessions.isActive.mockResolvedValue(true);
	await expect(f.service.begin(identity, purpose, 'wrong')).rejects.toThrow();
	f.keys.findBy.mockResolvedValue([]);
	await expect(f.service.begin(identity, purpose, 'synthetic-password')).rejects.toThrow();
	expect(f.store.create).not.toHaveBeenCalled();
});

test('policy drift during password verification prevents challenge creation', async () => {
	const f = fixture();
	f.profiles.findOneByOrFail.mockResolvedValueOnce(mockDeep<MiUserProfile>(f.profile)).mockResolvedValue(mockDeep<MiUserProfile>({ ...f.profile, passkeyMfaEnabled: true }));
	await expect(f.service.begin(identity, purpose, 'synthetic-password')).rejects.toThrow();
	expect(f.store.create).not.toHaveBeenCalled();
});

test('slow begin cannot extend password freshness into a new 90-second challenge', async () => {
	const f = fixture(); vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValue(90_001);
	await expect(f.service.begin(identity, purpose, 'synthetic-password')).rejects.toThrow();
	expect(f.store.create).not.toHaveBeenCalled();
});

test.each(['password', 'twoFactorSecret', 'twoFactorEnabled', 'passkeyMfaEnabled', 'key'] as const)('current %s drift burns claimed challenge before verifier', async field => {
	const f = fixture(); const started = await f.service.begin(identity, purpose, 'synthetic-password');
	if (field === 'key') f.keys.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>({ ...f.key, publicKey: 'BAUG' })]);
	else f.profiles.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ ...f.profile, [field]: typeof f.profile[field] === 'boolean' ? true : 'changed' }));
	await expect(f.service.complete(identity, purpose, started.ticket, assertion)).rejects.toThrow();
	expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
	await expect(f.service.complete(identity, purpose, started.ticket, assertion)).rejects.toThrow();
});

test.each(['false', 'no-uv', 'exception', 'counter-race', 'session-revoked', 'policy-drift', 'expired'] as const)('verification %s fails without a reusable result', async failure => {
	const f = fixture(); const started = await f.service.begin(identity, purpose, 'synthetic-password');
	const good = await vi.mocked(webauthn.verifyAuthenticationResponse).getMockImplementation()!({} as Parameters<typeof webauthn.verifyAuthenticationResponse>[0]);
	vi.mocked(webauthn.verifyAuthenticationResponse).mockImplementationOnce(async () => {
		if (failure === 'exception') throw new Error('synthetic invalid assertion');
		if (failure === 'counter-race') f.keys.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });
		if (failure === 'session-revoked') f.sessions.isActive.mockResolvedValue(false);
		if (failure === 'policy-drift') f.profiles.findOneByOrFail.mockResolvedValue(mockDeep<MiUserProfile>({ ...f.profile, passkeyMfaEnabled: true }));
		if (failure === 'expired') vi.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
		return { ...good, verified: failure !== 'false', authenticationInfo: { ...good.authenticationInfo, userVerified: failure !== 'no-uv' } };
	});
	await expect(f.service.complete(identity, purpose, started.ticket, assertion)).rejects.toThrow();
	await expect(f.service.complete(identity, purpose, started.ticket, assertion)).rejects.toThrow();
});

test('unknown credential is rejected before verifier and simultaneous claims get one owner', async () => {
	const f = fixture(); const a = await f.service.begin(identity, purpose, 'synthetic-password');
	await expect(f.service.complete(identity, purpose, a.ticket, { ...assertion, id: 'BAUG' })).rejects.toThrow();
	expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
	const b = await f.service.begin(identity, purpose, 'synthetic-password');
	const results = await Promise.allSettled([1, 2].map(() => f.service.complete(identity, purpose, b.ticket, assertion)));
	expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledTimes(1);
});

test('stamp is key-order independent and changes for ownership/material/policy, not counters', () => {
	const f = fixture(); const second = { ...f.key, id: 'BAUG' };
	const stamp = freshReauthenticationPolicyStamp(f.profile, [f.key, second]);
	expect(freshReauthenticationPolicyStamp(f.profile, [second, f.key])).toBe(stamp);
	expect(freshReauthenticationPolicyStamp(f.profile, [{ ...f.key, counter: 5 } as typeof f.key, second])).toBe(stamp);
	expect(() => freshReauthenticationPolicyStamp(f.profile, [{ ...f.key, userId: 'other' }])).toThrow();
	expect(freshReauthenticationPolicyStamp(f.profile, [f.key])).not.toBe(stamp);
});

test.each([true, false])('real legacy P-256 signature: UV=%s is strictly enforced before counter CAS', async uv => {
	const f = fixture();
	const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
	const jwk = pair.publicKey.export({ format: 'jwk' });
	const legacy = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
	f.keys.findBy.mockResolvedValue([mockDeep<MiUserSecurityKey>({ ...f.key, publicKey: legacy, counter: 0 })]);
	const started = await f.service.begin(identity, purpose, 'synthetic-password');
	const client = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: started.options.challenge, origin: 'https://synthetic.example', crossOrigin: false }));
	const authData = Buffer.alloc(37);
	createHash('sha256').update('synthetic.example').digest().copy(authData);
	authData[32] = uv ? 5 : 1; // UP, with or without UV
	authData.writeUInt32BE(2, 33);
	const signature = sign('sha256', Buffer.concat([authData, createHash('sha256').update(client).digest()]), pair.privateKey);
	const real = await vi.importActual<typeof import('@simplewebauthn/server')>('@simplewebauthn/server');
	vi.mocked(webauthn.verifyAuthenticationResponse).mockImplementationOnce(real.verifyAuthenticationResponse);
	const result = f.service.complete(identity, purpose, started.ticket, {
		...assertion, response: { clientDataJSON: client.toString('base64url'), authenticatorData: authData.toString('base64url'), signature: signature.toString('base64url'), userHandle: Buffer.from(identity.userId).toString('base64url') },
	});
	if (uv) {
		await expect(result).resolves.toMatchObject({ userId: identity.userId, purpose });
		expect(f.keys.update).toHaveBeenCalledWith(expect.objectContaining({ publicKey: legacy, counter: 0 }), expect.objectContaining({ publicKey: normalizedPasskeyPublicKey(legacy), counter: 2 }));
	} else {
		await expect(result).rejects.toThrow();
		expect(f.keys.update).not.toHaveBeenCalled();
	}
});
