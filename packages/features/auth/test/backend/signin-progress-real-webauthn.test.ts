/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { WebAuthnService } from '../../backend/services/WebAuthnService.js';
import { SigninProgressController, signinProgressBinding, type SigninProgressStorage } from '../../backend/signin-progress.js';
import { MiUserSecurityKey } from '../../backend/models/UserSecurityKey.js';

vi.unmock('@simplewebauthn/server');

test.each([false, true])('real signed strict-UV proof allows equivalent legacy key, replacement=%s', async replace => {
	const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
	const jwk = publicKey.export({ format: 'jwk' });
	const legacy = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
	const key = new MiUserSecurityKey({}); Object.assign(key, { id: 'AQID', userId: 'synthetic', counter: 0, publicKey: legacy, transports: null });
	const keys = mockDeep<ConstructorParameters<typeof WebAuthnService>[3]>(); keys.findOneBy.mockResolvedValue(key);
	keys.update.mockImplementation(async (_where, update) => { Object.assign(key, update); });
	const redis = mockDeep<ConstructorParameters<typeof WebAuthnService>[2]>(); redis.getdel.mockResolvedValue('synthetic-challenge');
	const service = new WebAuthnService(mockDeep<ConstructorParameters<typeof WebAuthnService>[0]>({ url: 'https://synthetic.example', hostname: 'synthetic.example' }), mockDeep<ConstructorParameters<typeof WebAuthnService>[1]>(), redis, keys);
	const clientData = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: 'synthetic-challenge', origin: 'https://synthetic.example' }));
	const authData = Buffer.concat([createHash('sha256').update('synthetic.example').digest(), Buffer.from([5]), Buffer.from([0, 0, 0, 1])]);
	const signature = sign('sha256', Buffer.concat([authData, createHash('sha256').update(clientData).digest()]), privateKey);
	const assertion = { id: 'AQID', rawId: 'AQID', type: 'public-key' as const, response: { clientDataJSON: clientData.toString('base64url'), authenticatorData: authData.toString('base64url'), signature: signature.toString('base64url') }, clientExtensionResults: {} };
	const binding = () => signinProgressBinding({ userId: 'synthetic', origin: 'https://synthetic.example', rpId: 'synthetic.example', captcha: [], passwordHash: 'synthetic', totpEnabled: true, totpSecret: 'synthetic', passwordless: false, keys: [key] });
	const context = binding(); const store = mockDeep<SigninProgressStorage>();
	const metadata = { ...context, version: 1, state: 'active' as const, createdAt: 1, facts: { password: 1 } };
	store.read.mockResolvedValue(metadata); store.claim.mockResolvedValue({ nonce: 'o'.repeat(43), version: 2, metadata: { ...metadata, state: 'claimed' } });
	store.finishClaim.mockResolvedValue({ nonce: 'f'.repeat(43), version: 3, metadata: { ...metadata, state: 'claimed', facts: { password: 1, passkey: 2 } } });
	store.consume.mockResolvedValue({ ...metadata, state: 'claimed', facts: { password: 1, passkey: 2 } });
	let cryptographicResult = false;
	expect(await new SigninProgressController(store).finish(context, { ticket: 't'.repeat(43), browserSecret: 'b'.repeat(43), nonce: 'n'.repeat(43), version: 1 }, 'passkey', async () => {
		cryptographicResult = await service.verifyAuthentication('synthetic', assertion);
		if (replace) key.publicKey = 'different-key';
		return cryptographicResult;
	}, async () => binding())).toBe(!replace);
	expect(cryptographicResult).toBe(true); expect(key.counter).toBe(1);
	if (replace) expect(store.consume).not.toHaveBeenCalled(); else expect(store.consume).toHaveBeenCalledOnce();
});
