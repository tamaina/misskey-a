/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createOidcTokenExchange } from '../../backend/oidc-token-exchange.js';
import type { BoundOidcExchangeTransaction } from '../../backend/oidc-token-exchange.js';
import type { ClientMetadataNetwork } from '../../backend/oauth/ClientMetadataFetcher.js';
import type { ConnectionOptions } from 'node:tls';
import type { Agent, RequestOptions } from 'node:https';
import type { IncomingMessage } from 'node:http';

const issuer = 'https://issuer.example/realm';
const address = '93.184.216.34';
const provider = { id: 'synthetic-provider', version: '1', issuer, clientId: 'synthetic client:+', enabled: true, redirectUri: 'https://instance.invalid/oidc/callback?fixed=1' };
const metadata = { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token?fixed=1`, jwks_uri: `${issuer}/keys`, response_types_supported: ['code'], id_token_signing_alg_values_supported: ['RS256'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_basic'] };
const verifier = 'v'.repeat(43);
const pending: BoundOidcExchangeTransaction = { providerId: provider.id, providerVersion: provider.version, issuer, clientId: provider.clientId, purpose: { mode: 'login' }, nonce: 'synthetic-nonce', codeVerifier: verifier, codeChallenge: createHash('sha256').update(verifier).digest('base64url'), redirectUri: provider.redirectUri };
const secret = 'synthetic secret:+/&';
const code = 'synthetic code:+/&';
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let attacker: Awaited<ReturnType<typeof generateKeyPair>>;
let publicKey: Awaited<ReturnType<typeof exportJWK>>;
let token: string;

async function sign(claims: Record<string, unknown> = {}, header: Record<string, unknown> = {}, key = pair.privateKey) {
	const now = Math.floor(Date.now() / 1000);
	return await new SignJWT({ iss: issuer, sub: 'synthetic-subject', aud: provider.clientId, nonce: pending.nonce,
																												iat: now - 10, exp: now + 300, ...claims }).setProtectedHeader({ alg: 'RS256', kid: 'trusted', ...header }).sign(key);
}

beforeAll(async () => {
	pair = await generateKeyPair('RS256');
	attacker = await generateKeyPair('RS256');
	publicKey = { ...await exportJWK(pair.publicKey), kid: 'trusted', alg: 'RS256', use: 'sig' };
	token = await sign();
});
afterEach(() => { vi.useRealTimers(); });

type Scenario = {
	addresses?: string[]; peer?: string; authorized?: boolean; tlsError?: boolean; neverTls?: boolean;
	status?: number; media?: string; encoding?: string; length?: string; raw?: string;
	json?: unknown; bodyDelay?: number; neverBody?: boolean;
};

function fixture(scenarios: Scenario[] = []) {
	let index = 0;
	let secure = false;
	const sockets: (EventEmitter & { destroyed: boolean; destroy: () => void })[] = [];
	const tlsOptions: ConnectionOptions[] = [];
	const http: { url: URL; options: RequestOptions; form: string | undefined }[] = [];
	const dependencies = {
		lookup: vi.fn(async () => (scenarios[index]?.addresses ?? [address]).map(value => ({ address: value, family: value.includes(':') ? 6 : 4 }))),
		connect: vi.fn((options: ConnectionOptions) => {
			const scenario = scenarios[index] ?? {};
			secure = false;
			tlsOptions.push(options);
			const socket = Object.assign(new EventEmitter(), {
				destroyed: false, authorized: scenario.authorized ?? true, remoteAddress: scenario.peer ?? address,
				destroy() { this.destroyed = true; },
			});
			sockets.push(socket);
			if (!scenario.neverTls) queueMicrotask(() => {
				if (scenario.tlsError) socket.emit('error', new Error(secret));
				else { secure = true; socket.emit('secureConnect'); }
			});
			return socket;
		}),
		request: vi.fn((url: URL, options: RequestOptions, receive: (response: IncomingMessage) => void) => {
			expect(secure).toBe(true); // HTTP must not even be constructed before TLS.
			const current = index++;
			const scenario = scenarios[current] ?? {};
			const call = { url, options, form: undefined as string | undefined };
			http.push(call);
			const request = Object.assign(new EventEmitter(), { destroy: vi.fn(), end: vi.fn((form?: string) => {
				call.form = form;
				(options.agent as Agent).createConnection({}, (error: Error | null) => {
					if (error) { request.emit('error', error); return; }
					const response = Object.assign(new Readable({ read() {} }), {
						statusCode: scenario.status ?? 200,
						headers: { 'content-type': scenario.media ?? 'application/json',
																	...(scenario.encoding ? { 'content-encoding': scenario.encoding } : {}),
																	...(scenario.length ? { 'content-length': scenario.length } : {}) },
					});
					receive(response as IncomingMessage);
					if (!scenario.neverBody) {
						const send = () => {
							response.push(scenario.raw ?? JSON.stringify(scenario.json ?? (current === 0
								? { id_token: token, access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token', token_type: 'Bearer' }
								: { keys: [publicKey] })));
							response.push(null);
						};
						if (scenario.bodyDelay) setTimeout(send, scenario.bodyDelay); else queueMicrotask(send);
					}
				});
			}) });
			return request;
		}),
	} as unknown as ClientMetadataNetwork;
	return { dependencies, sockets, tlsOptions, http, exchange: createOidcTokenExchange(dependencies) };
}

test('real RSA exchange binds PKCE/callback, encodes Basic credentials, and returns identity only', async () => {
	const f = fixture();
	expect(await f.exchange(provider, metadata, pending, code, secret)).toEqual({ issuer, subject: 'synthetic-subject' });
	expect(f.http.map(call => call.url.href)).toEqual([metadata.token_endpoint, metadata.jwks_uri]);
	const post = f.http[0];
	expect(post.options.method).toBe('POST');
	const form = new URLSearchParams(post.form);
	expect(Object.fromEntries(form)).toEqual({ grant_type: 'authorization_code', code, redirect_uri: provider.redirectUri, code_verifier: verifier });
	expect(form.has('client_secret')).toBe(false);
	const headers = post.options.headers as Record<string, string>;
	const basic = Buffer.from(headers.authorization.slice('Basic '.length), 'base64').toString();
	const encode = (value: string) => new URLSearchParams({ value }).toString().slice(6);
	expect(basic).toBe(`${encode(provider.clientId)}:${encode(secret)}`);
	expect(f.http[1].options.headers).not.toHaveProperty('authorization');
	expect(f.tlsOptions[0]).toMatchObject({ host: address, servername: 'issuer.example', rejectUnauthorized: true });
	expect(f.tlsOptions[0].checkServerIdentity?.('ignored', { subjectaltname: 'DNS:wrong.example' } as never)).toBeInstanceOf(Error);
	expect(f.sockets.every(socket => socket.destroyed)).toBe(true);
});

test.each([
	{ addresses: ['127.0.0.1'] }, { addresses: [address, '10.0.0.1'] }, { addresses: ['::1'] },
	{ peer: '127.0.0.1' }, { peer: '8.8.8.8' }, { authorized: false }, { tlsError: true },
])('never constructs HTTP or passes credentials for unsafe DNS/TLS %j', async scenario => {
	const f = fixture([scenario]);
	await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow('OIDC token exchange failed');
	expect(f.dependencies.request).not.toHaveBeenCalled();
});

test.each([302, 307, 308, 400, 500])('does not follow redirects or expose error response %s', async status => {
	const f = fixture([{ status, raw: `${secret} ${code} ${token}` }]);
	await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow('OIDC token exchange failed');
	expect(f.http).toHaveLength(1);
});

test.each([
	{ media: 'text/html' }, { encoding: 'gzip' }, { length: '65537' }, { raw: 'x'.repeat(65537) },
	{ raw: 'malformed JSON' }, { json: [] }, { json: { error: secret } },
])('rejects invalid bounded token responses %j', async scenario => {
	const f = fixture([scenario]);
	await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow('OIDC token exchange failed');
	expect(f.http).toHaveLength(1);
});

test.each([
	{ providerId: 'other' }, { providerVersion: '2' }, { issuer: 'https://other.invalid' },
	{ clientId: 'other' }, { redirectUri: 'https://other.invalid/callback' },
	{ codeVerifier: 'x'.repeat(43) }, { codeVerifier: 'short' }, { codeChallenge: 'other' },
])('rejects binding or PKCE mismatch before DNS %j', async change => {
	const f = fixture();
	await expect(f.exchange(provider, metadata, { ...pending, ...change }, code, secret)).rejects.toThrow();
	expect(f.dependencies.lookup).not.toHaveBeenCalled();
});

test.each([
	{ enabled: false }, { issuer: 'http://issuer.example' },
	{ redirectUri: 'https://user:secret@instance.invalid/callback' },
])('rejects disabled/invalid server configuration before network %j', async change => {
	const f = fixture();
	await expect(f.exchange({ ...provider, ...change }, metadata, pending, code, secret)).rejects.toThrow();
	expect(f.dependencies.lookup).not.toHaveBeenCalled();
});

test('rejects cross-origin endpoints before network', async () => {
	for (const field of ['token_endpoint', 'jwks_uri']) {
		const f = fixture();
		await expect(f.exchange(provider, { ...metadata, [field]: 'https://other.example/path' }, pending, code, secret)).rejects.toThrow();
		expect(f.dependencies.lookup).not.toHaveBeenCalled();
	}
});

test('bounds encoded form and Basic header before DNS', async () => {
	for (const [largeCode, largeSecret] of [['あ'.repeat(4000), secret], [code, 'あ'.repeat(2000)]]) {
		const f = fixture();
		await expect(f.exchange(provider, metadata, pending, largeCode, largeSecret)).rejects.toThrow();
		expect(f.dependencies.lookup).not.toHaveBeenCalled();
	}
});

test('rejects wrong nonce, unknown kid and attacker signature without key-location fetch or retry', async () => {
	for (const signed of [await sign({ nonce: 'other' }), await sign({}, { kid: 'unknown', jku: 'https://attacker.invalid/keys' }), await sign({}, {}, attacker.privateKey)]) {
		const f = fixture([{ json: { id_token: signed, access_token: 'synthetic', token_type: 'Bearer' } }]);
		await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
		expect(f.http.map(call => call.url.href)).toEqual([metadata.token_endpoint, metadata.jwks_uri]);
	}
});

const jwksCases: [string, () => unknown][] = [
	['empty', () => ({ keys: [] })], ['too many', () => ({ keys: Array.from({ length: 33 }, () => publicKey) })],
	['private', () => ({ keys: [{ ...publicKey, d: 'synthetic-private' }] })],
	['small modulus', () => ({ keys: [{ ...publicKey, n: 'small' }] })],
	['invalid exponent', () => ({ keys: [{ ...publicKey, e: '!' }] })],
	['long kid', () => ({ keys: [{ ...publicKey, kid: 'x'.repeat(257) }] })],
];
test.each(jwksCases)('rejects non-public or oversized JWKS %s', async (_name, create) => {
	const f = fixture([{}, { json: create() }]);
	await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
});

test('rejects a non-Bearer token response before JWKS fetch', async () => {
	const f = fixture([{ json: { id_token: token, access_token: 'synthetic', token_type: 'Other' } }]);
	await expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
	expect(f.http).toHaveLength(1);
});

test('never follows remote token/JWK key URLs and does not trust email', async () => {
	const signed = await sign({ email: 'synthetic@example.invalid', email_verified: true }, { jku: 'https://attacker.invalid/key', x5u: 'https://attacker.invalid/cert' });
	const f = fixture([{ json: { id_token: signed, access_token: 'synthetic', token_type: 'Bearer' } },
																				{ json: { keys: [{ ...publicKey, x5u: 'https://attacker.invalid/cert' }] } }]);
	expect(await f.exchange(provider, metadata, pending, code, secret)).toEqual({ issuer, subject: 'synthetic-subject' });
	expect(f.http.map(call => call.url.href)).toEqual([metadata.token_endpoint, metadata.jwks_uri]);
});

test('errors retain no code, secret, header, body, token payload or original cause', async () => {
	const f = fixture([{ json: { error: `${secret} ${code} ${token}` } }]);
	const error = await f.exchange(provider, metadata, pending, code, secret).catch(error => error as Error);
	expect(error).toBeInstanceOf(Error);
	if (!(error instanceof Error)) throw new Error('Expected rejection');
	for (const value of [secret, code, token]) expect(String(error.stack)).not.toContain(value);
	expect(error).not.toHaveProperty('cause');
	expect(error).not.toHaveProperty('payload');
});

test('a shared five-second deadline covers DNS and rejects late DNS before TLS', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
	const f = fixture();
	let finishDns: ((value: { address: string; family: number }[]) => void) | undefined;
	vi.mocked(f.dependencies.lookup).mockImplementation(() => new Promise(resolve => { finishDns = resolve; }));
	const rejected = expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
	await vi.advanceTimersByTimeAsync(5001);
	await rejected;
	finishDns?.([{ address, family: 4 }]);
	await Promise.resolve();
	expect(f.dependencies.connect).not.toHaveBeenCalled();
	expect(f.dependencies.request).not.toHaveBeenCalled();
});

test('late TLS completion cannot construct an HTTP request after expiry', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
	const f = fixture([{ neverTls: true }]);
	const rejected = expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
	await vi.advanceTimersByTimeAsync(5001);
	await rejected;
	f.sockets[0].emit('secureConnect');
	await Promise.resolve();
	expect(f.dependencies.request).not.toHaveBeenCalled();
	expect(f.sockets[0].destroyed).toBe(true);
});

test('token response and JWKS share one five-second budget instead of resetting it', async () => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
	const f = fixture([{ bodyDelay: 3000 }, { bodyDelay: 3000 }]);
	const rejected = expect(f.exchange(provider, metadata, pending, code, secret)).rejects.toThrow();
	await vi.advanceTimersByTimeAsync(5001);
	await rejected;
	expect(f.http).toHaveLength(2);
	expect(f.sockets.every(socket => socket.destroyed)).toBe(true);
});

test('snapshots server-owned inputs before asynchronous DNS', async () => {
	const f = fixture();
	let finishDns: ((value: { address: string; family: number }[]) => void) | undefined;
	vi.mocked(f.dependencies.lookup).mockImplementationOnce(() => new Promise(resolve => { finishDns = resolve; }));
	const mutableProvider = { ...provider };
	const mutableMetadata = { ...metadata };
	const mutablePending = { ...pending };
	const result = f.exchange(mutableProvider, mutableMetadata, mutablePending, code, secret);
	mutableProvider.clientId = 'other'; mutableMetadata.token_endpoint = 'https://attacker.invalid/path'; mutablePending.nonce = 'other';
	finishDns?.([{ address, family: 4 }]);
	expect(await result).toEqual({ issuer, subject: 'synthetic-subject' });
	expect(f.http[0].url.href).toBe(metadata.token_endpoint);
});
