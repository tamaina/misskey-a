/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as webauthn from '@simplewebauthn/server';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';

vi.mock('@simplewebauthn/server', async original => ({
	...await original<typeof import('@simplewebauthn/server')>(),
	verifyRegistrationResponse: vi.fn(),
	verifyAuthenticationResponse: vi.fn(),
}));

function harness() {
	const keys = mockDeep<ConstructorParameters<typeof WebAuthnService>[3]>();
	const key = new MiUserSecurityKey({});
	Object.assign(key, { id: 'AQID', userId: 'synthetic-user', publicKey: 'AQID', counter: 1, transports: ['usb'] });
	keys.findBy.mockResolvedValue([key]);
	keys.findOneBy.mockResolvedValue(key);
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>();
	redis.get.mockResolvedValue('synthetic-challenge');
	redis.getdel.mockResolvedValue('synthetic-challenge');
	const service = new WebAuthnService(
		mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://synthetic.example', hostname: 'synthetic.example', host: 'synthetic.example' }),
		mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>({ name: 'Synthetic' }), redis, keys,
	);
	return { service, redis, keys };
}

const assertion = {
	id: 'AQID', rawId: 'AQID', type: 'public-key' as const,
	response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID', userHandle: 'AQID' },
	clientExtensionResults: {},
};

test('real generators request required UV and retain RP, credentials and 90-second storage', async () => {
	const { service, redis } = harness();
	const registration = await service.initiateRegistration('synthetic-user', 'synthetic');
	expect(registration.authenticatorSelection).toMatchObject({ residentKey: 'required', userVerification: 'required' });
	expect(registration.rp.id).toBe('synthetic.example');
	expect(registration.excludeCredentials).toEqual([{ id: 'AQID', type: 'public-key', transports: ['usb'] }]);
	const named = await service.initiateAuthentication('synthetic-user');
	expect(named).toMatchObject({ rpId: 'synthetic.example', userVerification: 'required', allowCredentials: [{ id: 'AQID', type: 'public-key', transports: ['usb'] }] });
	const anonymous = await service.initiateSignInWithPasskeyAuthentication('synthetic-context');
	expect(anonymous).toMatchObject({ rpId: 'synthetic.example', userVerification: 'required', allowCredentials: undefined });
	for (const [key, result] of [
		['webauthn:registrationChallenge:synthetic-user', registration],
		['webauthn:authenticationChallenge:synthetic-user', named],
		['webauthn:passkeyChallenge:synthetic-context', anonymous],
	] as const) expect(redis.setex).toHaveBeenCalledWith(key, 90, result.challenge);
});

test('registration still requires UV and rejects verifier failure', async () => {
	const { service, keys } = harness();
	const verify = vi.mocked(webauthn.verifyRegistrationResponse).mockRejectedValue(new Error('Synthetic UV missing'));
	vi.spyOn(console, 'error').mockImplementation(() => {});
	await expect(service.verifyRegistration('synthetic-user', {
		id: 'AQID', rawId: 'AQID', type: 'public-key', response: { clientDataJSON: 'AQID', attestationObject: 'AQID' }, clientExtensionResults: {},
	})).rejects.toThrow('verification failed');
	expect(verify).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: true, expectedChallenge: 'synthetic-challenge', expectedOrigin: 'https://synthetic.example', expectedRPID: 'synthetic.example' }));
	expect(keys.update).not.toHaveBeenCalled();
});

test.each(['named', 'anonymous'] as const)('%s authentication requires UV and rejects verifier failure', async route => {
	const { service, keys } = harness();
	const verify = vi.mocked(webauthn.verifyAuthenticationResponse).mockRejectedValue(new Error('Synthetic UV missing'));
	vi.spyOn(console, 'error').mockImplementation(() => {});
	const result = route === 'named' ? service.verifyAuthentication('synthetic-user', assertion) : service.verifySignInWithPasskeyAuthentication('synthetic-context', assertion);
	await expect(result).rejects.toThrow('verification failed');
	expect(verify).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: true, expectedChallenge: 'synthetic-challenge', expectedOrigin: 'https://synthetic.example', expectedRPID: 'synthetic.example' }));
	expect(keys.update).not.toHaveBeenCalled();
	if (route === 'named') expect(keys.findOneBy).toHaveBeenCalledWith({ id: 'AQID', userId: 'synthetic-user' });
});

test('registration rejects an unexpected descriptor type before storing its challenge', async () => {
	const { service, redis } = harness();
	const valid = await service.initiateRegistration('synthetic-user', 'synthetic');
	redis.setex.mockClear();
	const generate = vi.spyOn(webauthn, 'generateRegistrationOptions').mockResolvedValueOnce({
		...valid, excludeCredentials: [{ id: 'AQID', type: 'synthetic-invalid', transports: ['usb'] }],
	});
	try {
		await expect(service.initiateRegistration('synthetic-user', 'synthetic')).rejects.toThrow();
		expect(redis.setex).not.toHaveBeenCalled();
	} finally { generate.mockRestore(); }
});

test.each(['named', 'anonymous'] as const)('%s authentication rejects an unexpected descriptor type before storing its challenge', async route => {
	const { service, redis } = harness();
	const valid = await service.initiateAuthentication('synthetic-user');
	redis.setex.mockClear();
	const generate = vi.spyOn(webauthn, 'generateAuthenticationOptions').mockResolvedValueOnce({
		...valid, allowCredentials: [{ id: 'AQID', type: 'synthetic-invalid', transports: ['usb'] }],
	});
	try {
		const result = route === 'named' ? service.initiateAuthentication('synthetic-user') : service.initiateSignInWithPasskeyAuthentication('synthetic-context');
		await expect(result).rejects.toThrow();
		expect(redis.setex).not.toHaveBeenCalled();
	} finally { generate.mockRestore(); }
});

test.each(['named', 'anonymous'] as const)('%s login proof captures expectation before strict UV and updates the exact verified row', async route => {
	const { service, redis, keys } = harness();
	redis.eval.mockResolvedValue(['synthetic-challenge', 90_000]);
	keys.update.mockResolvedValue({ affected: 1 });
	const order: string[] = [];
	vi.mocked(webauthn.verifyAuthenticationResponse).mockImplementation(async options => {
		order.push('verify');
		expect(options).toMatchObject({ requireUserVerification: true, expectedChallenge: 'synthetic-challenge', expectedRPID: 'synthetic.example', expectedOrigin: 'https://synthetic.example' });
		return { verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 2, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } };
	});
	const before = vi.fn(async key => { order.push('snapshot'); expect(Object.isFrozen(key)).toBe(true); return 'original-policy'; });
	const result = await (route === 'named' ? service.verifyAuthenticationWithProof('synthetic-user', assertion, before) : service.verifySignInWithPasskeyWithProof('synthetic-context', assertion, before));
	expect(order).toEqual(['snapshot', 'verify']);
	expect(result).toMatchObject({ expected: 'original-policy', key: { id: 'AQID', userId: 'synthetic-user', publicKey: 'AQID' } });
	expect(keys.update).toHaveBeenCalledWith({ id: 'AQID', userId: 'synthetic-user', publicKey: 'AQID', counter: 1 }, expect.objectContaining({ counter: 2 }));
	expect(redis.eval).toHaveBeenCalledWith(expect.stringContaining('redis.call(\'PTTL\''), 1, route === 'named' ? 'webauthn:authenticationChallenge:synthetic-user' : 'webauthn:passkeyChallenge:synthetic-context');
});

test.each([null, ['synthetic', -1], ['synthetic', 0], ['synthetic', 90_001], ['synthetic', 0.5], ['synthetic', '90000']])('login proof rejects missing or unbounded remaining TTL %j', async claimed => {
	const { service, redis, keys } = harness(); redis.eval.mockResolvedValue(claimed);
	const before = vi.fn();
	await expect(service.verifyAuthenticationWithProof('synthetic-user', assertion, before)).rejects.toThrow('authentication failed');
	expect(before).not.toHaveBeenCalled(); expect(keys.update).not.toHaveBeenCalled();
});

test.each(['noUV', 'CAS'] as const)('login proof rejects %s even when verifier reports verified', async failure => {
	const { service, redis, keys } = harness(); redis.eval.mockResolvedValue(['synthetic-challenge', 90_000]);
	keys.update.mockResolvedValue({ affected: 0 });
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 2, userVerified: failure !== 'noUV', credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } });
	const result = service.verifyAuthenticationWithProof('synthetic-user', assertion, async () => 'original-policy');
	if (failure === 'noUV') { expect(await result).toBeNull(); expect(keys.update).not.toHaveBeenCalled(); } else await expect(result).rejects.toThrow('authentication failed');
});

test.each([-1, Number.NaN, Number.MAX_SAFE_INTEGER])('login proof rejects an invalid stored counter %s before crypto verification', async counter => {
	const { service, redis, keys } = harness(); redis.eval.mockResolvedValue(['synthetic-challenge', 90_000]);
	keys.findOneBy.mockResolvedValue(Object.assign(new MiUserSecurityKey({}), { id: 'AQID', userId: 'synthetic-user', publicKey: 'AQID', counter }));
	const before = vi.fn();
	await expect(service.verifyAuthenticationWithProof('synthetic-user', assertion, before)).rejects.toThrow('authentication failed');
	expect(before).not.toHaveBeenCalled(); expect(keys.update).not.toHaveBeenCalled();
});
