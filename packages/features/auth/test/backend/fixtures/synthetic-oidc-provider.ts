/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import https from 'node:https';
import tls from 'node:tls';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { ClientMetadataNetwork } from '../../../backend/oauth/ClientMetadataFetcher.js';

/** Task-owned HTTPS IdP. Every key, code, secret and identity is synthetic. */
export async function syntheticOidcProvider() {
	const directory = mkdtempSync('/tmp/misskey-oidc-idp-');
	let server: https.Server | undefined;
	try {
		execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'), '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'], { stdio: 'ignore' });
		const certificate = readFileSync(join(directory, 'cert.pem'));
		const pair = await generateKeyPair('RS256'); const wrong = await generateKeyPair('RS256');
		const jwk = { ...await exportJWK(pair.publicKey), kid: 'synthetic', alg: 'RS256', use: 'sig' };
		const codes = new Map<string, { nonce: string; challenge: string; redirect: string }>();
		const options = { subject: 'synthetic-subject', failure: 'none' as 'none' | 'nonce' | 'issuer' | 'signature' | 'http' };
		let issuer = '';
		server = https.createServer({ key: readFileSync(join(directory, 'key.pem')), cert: certificate }, async (req, res) => {
			try {
				const url = new URL(req.url!, issuer);
				const json = (value: unknown) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(value)); };
				if (url.pathname === '/.well-known/openid-configuration') return json({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/keys`, response_types_supported: ['code'], id_token_signing_alg_values_supported: ['RS256'], code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['client_secret_basic'] });
				if (url.pathname === '/keys') return json({ keys: [jwk] });
				if (url.pathname === '/authorize') {
					if (url.searchParams.get('client_id') !== 'synthetic-client' || url.searchParams.get('code_challenge_method') !== 'S256' || url.searchParams.get('response_type') !== 'code') throw new Error('Invalid synthetic authorization');
					const redirect = url.searchParams.get('redirect_uri')!; const destination = new URL(redirect);
					if (destination.origin !== 'https://synthetic.example') throw new Error('Unexpected redirect');
					const code = randomBytes(24).toString('base64url');
					codes.set(code, { nonce: url.searchParams.get('nonce')!, challenge: url.searchParams.get('code_challenge')!, redirect });
					destination.searchParams.set('code', code); destination.searchParams.set('state', url.searchParams.get('state')!);
					res.writeHead(302, { location: destination.href }); res.end(); return;
				}
				if (url.pathname === '/token') {
					if (options.failure === 'http') { res.writeHead(500); res.end(); return; }
					if (req.method !== 'POST' || req.headers.authorization !== `Basic ${Buffer.from('synthetic-client:synthetic-secret').toString('base64')}`) throw new Error('Invalid synthetic client');
					let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 16384) throw new Error('Oversized synthetic form'); }
					const form = new URLSearchParams(body); const code = form.get('code')!; const pending = codes.get(code); codes.delete(code);
					if (!pending || form.get('redirect_uri') !== pending.redirect || form.get('grant_type') !== 'authorization_code' || createHash('sha256').update(form.get('code_verifier')!).digest('base64url') !== pending.challenge) throw new Error('Synthetic code binding failed');
					const now = Math.floor(Date.now() / 1000);
					const idToken = await new SignJWT({ iss: options.failure === 'issuer' ? 'https://other.invalid' : issuer, sub: options.subject, aud: 'synthetic-client', nonce: options.failure === 'nonce' ? 'wrong' : pending.nonce, iat: now - 1, exp: now + 300, email: 'same@example.test', email_verified: true }).setProtectedHeader({ alg: 'RS256', kid: 'synthetic' }).sign(options.failure === 'signature' ? wrong.privateKey : pair.privateKey);
					return json({ id_token: idToken, access_token: 'synthetic-discarded-access', token_type: 'Bearer' });
				}
				res.writeHead(404); res.end();
			} catch { res.writeHead(400); res.end(); }
		});
		await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve); });
		const address = server.address(); if (!address || typeof address === 'string') throw new Error('Synthetic IdP unavailable'); issuer = `https://localhost:${address.port}`;
		const network: ClientMetadataNetwork = { lookup: async () => [{ address: '127.0.0.1', family: 4 }], connect: ((connection: tls.ConnectionOptions) => tls.connect({ ...connection, ca: certificate })) as typeof tls.connect, request: https.request };
		return { issuer, network, options, async authorize(url: string) {
			if (new URL(url).origin !== issuer) throw new Error('Unexpected synthetic authorization origin');
			return new Promise<{ state: string; code: string }>((resolve, reject) => {
				const request = https.get(url, { ca: certificate, hostname: '127.0.0.1', servername: 'localhost' }, response => {
					response.resume(); if (response.statusCode !== 302 || !response.headers.location) { reject(new Error('Synthetic authorization failed')); return; }
					const destination = new URL(response.headers.location); resolve({ state: destination.searchParams.get('state')!, code: destination.searchParams.get('code')! });
				}); request.once('error', reject);
			});
		}, async close() { await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())); rmSync(directory, { recursive: true, force: true }); } };
	} catch (error) { if (server?.listening) await new Promise<void>(resolve => server!.close(() => resolve())); rmSync(directory, { recursive: true, force: true }); throw error; }
}
