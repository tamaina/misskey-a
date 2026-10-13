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
