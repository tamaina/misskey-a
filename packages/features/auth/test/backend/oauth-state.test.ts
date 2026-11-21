/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomUUID } from 'node:crypto';
import { Redis } from 'ioredis';
import { afterAll, expect, it } from 'vitest';
import { OAuthStateStore } from '../../backend/oauth/OAuthStateStore.js';

const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
const redis = socket ? new Redis({ path: socket, lazyConnect: true }) : undefined;
afterAll(async () => { if (redis) await redis.quit(); });
const key = (kind: string, id: string) => `oauth:${kind}:${createHash('sha256').update(id).digest('hex')}`;

it.skipIf(!redis)('atomically consumes consent across provider instances with a bounded TTL', async () => {
	const a = new OAuthStateStore(redis!);
	const b = new OAuthStateStore(redis!);
	const id = randomUUID();
	await a.putTransaction(id, { request: 'synthetic' });
	expect(await redis!.ttl(key('transaction', id))).toBeGreaterThan(0);
	expect(await redis!.ttl(key('transaction', id))).toBeLessThanOrEqual(300);
	const results = await Promise.all([a.takeTransaction(id), b.takeTransaction(id)]);
	expect(results.filter(Boolean)).toEqual([{ request: 'synthetic' }]);
	expect(await a.takeTransaction(id)).toBeNull();
});

it.skipIf(!redis)('only one concurrent redemption wins; replay during insertion prevents token publication', async () => {
	const a = new OAuthStateStore(redis!);
	const b = new OAuthStateStore(redis!);
	const code = randomUUID();
	await a.putCode(code, { userId: 'synthetic-user' });
	const results = await Promise.all([a.claimCode(code), b.claimCode(code)]);
	expect(results.filter(result => result.claimed)).toHaveLength(1);
	expect(results.filter(result => !result.claimed)).toHaveLength(1);
	expect(await a.publishToken(code, 'synthetic-token-row')).toBe(false);
	await redis!.del(key('code', code));
});

it.skipIf(!redis)('replay identifies the token row for revocation without storing its credential', async () => {
	const a = new OAuthStateStore(redis!);
	const b = new OAuthStateStore(redis!);
	const code = randomUUID();
	await a.putCode(code, { userId: 'synthetic-user' });
	expect((await a.claimCode(code)).claimed).toBe(true);
	expect(await a.publishToken(code, 'synthetic-token-row')).toBe(true);
	expect(await b.claimCode(code)).toEqual({ claimed: false, replayTokenId: 'synthetic-token-row' });
	expect(await b.publishToken(code, 'another-row')).toBe(false);
	const raw = await redis!.get(key('code', code));
	expect(raw).not.toContain(code);
	expect(await redis!.ttl(key('code', code))).toBeLessThanOrEqual(300);
	await redis!.del(key('code', code));
});

it.skipIf(!redis)('missing or expired state cannot publish an inserted token row', async () => {
	const store = new OAuthStateStore(redis!);
	const code = randomUUID();
	await store.putCode(code, { userId: 'synthetic-user' });
	await redis!.pexpire(key('code', code), 1);
	await new Promise(resolve => setTimeout(resolve, 10));
	expect(await store.claimCode(code)).toEqual({ claimed: false });
	expect(await store.publishToken(code, 'synthetic-token-row')).toBe(false);
	expect(await store.takeTransaction(randomUUID())).toBeNull();
});
