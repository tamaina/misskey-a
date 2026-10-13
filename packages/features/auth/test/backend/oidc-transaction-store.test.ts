/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, it } from 'vitest';
import { OidcTransactionStore } from '../../backend/oidc-transaction-store.js';

// The explicit fixture socket must belong to this test task, never a shared Redis.
const socket = process.env.MISSKEY_OIDC_REDIS_SOCKET;
if (socket) {
	if (!/^\/tmp\/misskey-oidc-[^/]+\/redis\.sock$/.test(socket)) throw new Error('OIDC fixture requires task-owned Unix socket');
	const directory = lstatSync(dirname(socket));
	const endpoint = lstatSync(socket);
	if (!directory.isDirectory() || directory.uid !== process.getuid() || (directory.mode & 0o077) !== 0 || !endpoint.isSocket() || endpoint.uid !== process.getuid()) throw new Error('OIDC fixture socket ownership mismatch');
}
const redis = socket ? new Redis({ path: socket, lazyConnect: true }) : undefined;
afterAll(async () => { await redis?.quit(); });
const provider = { id: 'synthetic-provider', version: '1', issuer: 'https://issuer.invalid', clientId: 'fixture', enabled: true };
const login = { mode: 'login' } as const;
const hash = (value: string) => createHash('sha256').update(value).digest('base64url');
const key = (state: string) => `oidc:transaction:v1:${hash(state)}`;

describe.skipIf(!redis)('real atomic OIDC transactions on isolated Redis', () => {
	it('uses random state/nonce/verifier and bounded TTL without exposing verifier at start', async () => {
		const store = new OidcTransactionStore(redis!);
		const a = await store.create(provider, login);
		const b = await store.create(provider, login);
		expect(a.state).not.toBe(b.state);
		expect(a.nonce).not.toBe(b.nonce);
		expect(a).not.toHaveProperty('codeVerifier');
		expect(await redis!.ttl(key(a.state))).toBeGreaterThan(0);
		expect(await redis!.ttl(key(a.state))).toBeLessThanOrEqual(300);
		const raw = await redis!.get(key(a.state));
		expect(raw).not.toContain(a.browserSecret);
		const tx = await store.consume(provider, login, a.state, a.browserSecret);
		expect(tx?.nonce).toBe(a.nonce);
		expect(hash(tx!.codeVerifier)).toBe(a.codeChallenge);
		expect(a.codeChallengeMethod).toBe('S256');
		await store.cancel(provider, login, b.state, b.browserSecret);
	});
	it('does not consume on wrong browser/provider/version/issuer/client/mode or disabled provider', async () => {
		const store = new OidcTransactionStore(redis!);
		const start = await store.create(provider, login);
		await expect(store.consume(provider, login, start.state, 'a'.repeat(43))).resolves.toBeNull();
		for (const change of [{ id: 'other' }, { version: '2' }, { issuer: 'https://other.invalid' }, { clientId: 'other' }, { enabled: false }]) {
			await expect(store.consume({ ...provider, ...change }, login, start.state, start.browserSecret)).resolves.toBeNull();
		}
		await expect(store.consume(provider, { mode: 'link', localUserId: 'synthetic-user', localSessionId: 'synthetic-session' }, start.state, start.browserSecret)).resolves.toBeNull();
		expect(await redis!.exists(key(start.state))).toBe(1);
		expect(await store.consume(provider, login, start.state, start.browserSecret)).not.toBeNull();
	});
	it('has only one winner across concurrent store instances and rejects replay', async () => {
		const a = new OidcTransactionStore(redis!);
		const b = new OidcTransactionStore(redis!);
		const start = await a.create(provider, login);
		const results = await Promise.all([a.consume(provider, login, start.state, start.browserSecret), b.consume(provider, login, start.state, start.browserSecret)]);
		expect(results.filter(Boolean)).toHaveLength(1);
		expect(await a.consume(provider, login, start.state, start.browserSecret)).toBeNull();
	});
	it('rejects expired state without a grant', async () => {
		const store = new OidcTransactionStore(redis!);
		const start = await store.create(provider, login);
		await redis!.pexpire(key(start.state), 1);
		await new Promise(resolve => setTimeout(resolve, 10));
		expect(await store.consume(provider, login, start.state, start.browserSecret)).toBeNull();
	});
	it('binds server-owned link context, and cancellation makes late results unusable', async () => {
		const store = new OidcTransactionStore(redis!);
		const purpose = { mode: 'link', localUserId: 'synthetic-user', localSessionId: 'synthetic-session' } as const;
		const start = await store.create(provider, purpose);
		await expect(store.consume(provider, { ...purpose, localSessionId: 'other' }, start.state, start.browserSecret)).resolves.toBeNull();
		await expect(store.consume(provider, { ...purpose, localUserId: 'other' }, start.state, start.browserSecret)).resolves.toBeNull();
		expect(await store.cancel(provider, purpose, start.state, start.browserSecret)).toBe(true);
		expect(await store.consume(provider, purpose, start.state, start.browserSecret)).toBeNull();
	});
	it('does not create transactions for disabled providers', async () => {
		const store = new OidcTransactionStore(redis!);
		await expect(store.create({ ...provider, enabled: false }, login)).rejects.toThrow('disabled');
	});
});
