/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import * as webauthn from '@simplewebauthn/server';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { canonicalWebAuthnPublicKey } from '../../backend/webauthn-public-key.js';
import { SigninProgressController, type SigninProgressStorage, signinProgressBinding } from '../../backend/signin-progress.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';

vi.mock('@simplewebauthn/server', async original => ({ ...await original<typeof import('@simplewebauthn/server')>(), verifyAuthenticationResponse: vi.fn() }));
const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: 'AQID', authenticatorData: 'AQID', signature: 'AQID', userHandle: 'AQID' }, clientExtensionResults: {} };
test('actual strict-UV verifier legacy EC→COSE migration preserves policy while key replacement does not', async () => {
	const cert = Buffer.alloc(65, 1); cert[0] = 4; const legacy = cert.toString('base64url');
	expect(legacy).toHaveLength(87);
	const key = new MiUserSecurityKey({}); Object.assign(key, { id: 'AQID', userId: 'synthetic', counter: 0, publicKey: legacy, transports: null });
	const keys = mockDeep<ConstructorParameters<typeof WebAuthnService>[3]>(); keys.findOneBy.mockResolvedValue(key);
	keys.update.mockImplementation(async (_where, change) => { Object.assign(key, change); });
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>(); redis.getdel.mockResolvedValue('synthetic-challenge');
	const service = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://synthetic.example', hostname: 'synthetic.example' }), mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>(), redis, keys);
	const binding = () => signinProgressBinding({ userId: 'synthetic', origin: 'https://synthetic.example', rpId: 'synthetic.example', captcha: [], passwordHash: 'synthetic', totpEnabled: true, totpSecret: 'synthetic', passwordless: false, keys: [key] });
	const before = binding();
	vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({ verified: true, authenticationInfo: { credentialID: 'AQID', newCounter: 1, userVerified: true, credentialDeviceType: 'singleDevice', credentialBackedUp: false, origin: 'https://synthetic.example', rpID: 'synthetic.example' } });
	expect(await service.verifyAuthentication('synthetic', assertion)).toBe(true);
	expect(key.publicKey).toBe(canonicalWebAuthnPublicKey(legacy, 0)); expect(key.counter).toBe(1); expect(binding()).toEqual(before);
	expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(expect.objectContaining({ requireUserVerification: true, expectedChallenge: 'synthetic-challenge', credential: expect.objectContaining({ publicKey: Buffer.from(key.publicKey, 'base64url'), counter: 0 }) }));
	key.publicKey = 'changed-public-key'; expect(binding().userPolicyStamp).not.toBe(before.userPolicyStamp);
	for (const replace of [false, true]) {
		key.publicKey = legacy; key.counter = 0;
		const context = binding(); const store = mockDeep<SigninProgressStorage>();
		const metadata = { ...context, version: 1, state: 'active' as const, createdAt: 1, facts: { password: 1 } };
		store.read.mockResolvedValue(metadata);
		store.claim.mockResolvedValue({ version: 2, nonce: 'o'.repeat(43), metadata: { ...metadata, state: 'claimed' } });
		store.finishClaim.mockResolvedValue({ version: 3, nonce: 'f'.repeat(43), metadata: { ...metadata, state: 'claimed', facts: { password: 1, passkey: 2 } } });
		store.consume.mockResolvedValue({ ...metadata, state: 'claimed', facts: { password: 1, passkey: 2 } });
		const controller = new SigninProgressController(store);
		expect(await controller.finish(context, { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 1 }, 'passkey', async () => {
			const verified = await service.verifyAuthentication('synthetic', assertion);
			if (replace) key.publicKey = 'changed-public-key';
			return verified;
		}, async () => binding())).toBe(!replace);
		if (replace) expect(store.consume).not.toHaveBeenCalled(); else expect(store.consume).toHaveBeenCalledOnce();
	}
	expect(canonicalWebAuthnPublicKey(legacy, 1)).toBe(legacy);
});
