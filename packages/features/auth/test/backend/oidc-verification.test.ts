/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createOidcIdTokenVerifier, validateOidcMetadata, validateOidcUserInfoSubject } from '../../backend/oidc-verification.js';

const issuer = 'https://issuer.invalid';
const now = new Date('2026-10-13T00:00:00Z');
const time = now.getTime() / 1000;
const expected = { issuer, clientId: 'synthetic-client', nonce: 'synthetic-nonce', trustVerifiedEmail: false, now };
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let verify: ReturnType<typeof createOidcIdTokenVerifier>;
const claims = { iss: issuer, sub: 'synthetic-subject', aud: expected.clientId, nonce: expected.nonce, iat: time - 10, exp: time + 300 };

async function sign(overrides: Record<string, unknown> = {}, omit?: string, header: Record<string, unknown> = {}) {
	const payload: Record<string, unknown> = { ...claims, ...overrides };
	if (omit) delete payload[omit];
	return await new SignJWT(payload).setProtectedHeader({ alg: 'RS256', kid: 'trusted', ...header }).sign(keys.privateKey);
}

beforeAll(async () => {
	keys = await generateKeyPair('RS256');
	verify = createOidcIdTokenVerifier({ keys: [{ ...await exportJWK(keys.publicKey), kid: 'trusted', alg: 'RS256', use: 'sig' }] });
});

describe('finite OIDC ID token verification with real signatures', () => {
	it('returns only issuer and subject by default', async () => {
		expect(await verify(await sign({ email: 'synthetic@example.invalid', email_verified: true }), expected)).toEqual({ issuer, subject: claims.sub });
	});
	it.each(['iss', 'sub', 'aud', 'exp', 'iat', 'nonce'])('rejects missing %s', async claim => {
		await expect(verify(await sign({}, claim), expected)).rejects.toThrow();
	});
	it.each([
		{ iss: 'https://other.invalid' }, { aud: 'other' }, { azp: 'other' }, { nonce: 'other' },
		{ exp: time }, { iat: time + 1 }, { iat: time + 400 }, { iat: 'bad' },
		{ sub: '' }, { sub: 'x'.repeat(256) }, { sub: '日本語' }, { aud: [expected.clientId, 'other'] },
	])('rejects invalid claims %j', async override => {
		await expect(verify(await sign(override), expected)).rejects.toThrow();
	});
	it('rejects a signature from untrusted keys', async () => {
		const attacker = await generateKeyPair('RS256');
		const token = await new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'trusted' }).sign(attacker.privateKey);
		await expect(verify(token, expected)).rejects.toThrow();
	});
	it('rejects alternate algorithms', async () => {
		const token = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).sign(new Uint8Array(32));
		await expect(verify(token, expected)).rejects.toThrow();
	});
	it('ignores token-specified remote key locations', async () => {
		expect(await verify(await sign({}, undefined, { jku: 'https://attacker.invalid/keys' }), expected)).toEqual({ issuer, subject: claims.sub });
		await expect(verify(await sign({}, undefined, { kid: 'unknown', jku: 'https://attacker.invalid/keys' }), expected)).rejects.toThrow();
	});
	it.each([true, false, 'true', 1, undefined])('accepts verified email only with boolean true and explicit trust: %s', async verified => {
		const result = await verify(await sign({ email: 'synthetic@example.invalid', email_verified: verified }), { ...expected, trustVerifiedEmail: true });
		expect(result.verifiedEmail).toBe(verified === true ? 'synthetic@example.invalid' : undefined);
	});
	it('requires UserInfo subject equality', () => {
		const identity = { issuer, subject: claims.sub };
		expect(() => validateOidcUserInfoSubject(identity, { sub: claims.sub })).not.toThrow();
		for (const sub of [undefined, 'other', 1]) expect(() => validateOidcUserInfoSubject(identity, { sub })).toThrow();
	});
});

const metadata = { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/keys`, response_types_supported: ['code'], id_token_signing_alg_values_supported: ['RS256'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_basic'] };
describe('finite OIDC metadata capabilities', () => {
	it('accepts supported metadata', () => expect(() => validateOidcMetadata(metadata, issuer)).not.toThrow());
	it.each(['response_types_supported', 'id_token_signing_alg_values_supported', 'code_challenge_methods_supported', 'token_endpoint_auth_methods_supported'])('rejects unsupported %s', field => {
		expect(() => validateOidcMetadata({ ...metadata, [field]: [] }, issuer)).toThrow();
	});
	it.each(['http://issuer.invalid', 'https://name:secret@issuer.invalid', `${issuer}#fragment`])('rejects unsafe URL %s', url => {
		expect(() => validateOidcMetadata({ ...metadata, token_endpoint: url }, issuer)).toThrow();
	});
	it.each(['code', ['code', 1], null])('rejects malformed capabilities %j', response_types_supported => {
		const malformed = { ...metadata, response_types_supported } as unknown as typeof metadata;
		expect(() => validateOidcMetadata(malformed, issuer)).toThrow();
	});
	it('rejects issuer mismatch', () => expect(() => validateOidcMetadata(metadata, `${issuer}/other`)).toThrow());
});
