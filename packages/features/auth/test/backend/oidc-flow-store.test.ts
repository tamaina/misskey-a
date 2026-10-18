/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, test } from 'vitest';
import { OidcFlowStore, oidcHash } from '../../backend/oidc-flow-store.js';
import type { OidcFlow } from '../../backend/oidc-flow-store.js';

const socket = process.env.MISSKEY_OIDC_REDIS_SOCKET;
if (socket && (!/^\/tmp\/misskey-oidc-fixture-[^/]+\/redis\.sock$/.test(socket) || lstatSync(dirname(socket)).uid !== process.getuid?.() || !lstatSync(socket).isSocket())) throw new Error('Owned OIDC fixture Redis required');
const redis = socket ? new Redis({ path: socket }) : null;
afterAll(async () => { await redis?.quit(); });
const flow: OidcFlow = { providerId: 'synthetic', providerVersion: 'v', issuer: 'https://synthetic.example', subject: 'subject', purpose: { mode: 'login' } };
const secret = 'b'.repeat(43);
describe.skipIf(!redis)('real Redis OIDC continuation ownership', () => {
	test('wrong browser does not burn a continuation; correct consumption is once', async () => {
		const store = new OidcFlowStore(redis!); const ticket = await store.create(flow, secret);
		expect(await store.consume(ticket, 'c'.repeat(43))).toBeNull(); expect((await store.consume(ticket, secret))?.flow).toEqual(flow); expect(await store.consume(ticket, secret)).toBeNull();
	});
	test('email preparation CAS preserves original TTL and only one request wins', async () => {
		const store = new OidcFlowStore(redis!); const ticket = await store.create(flow, secret); const key = `oidc:flow:v1:${oidcHash(ticket)}`;
		await redis!.pexpire(key, 10_000); const before = await redis!.pttl(key);
		const attempts = await Promise.all([store.update(ticket, secret, 0, { ...flow, subject: 'first' }), store.update(ticket, secret, 0, { ...flow, subject: 'second' })]);
		expect(attempts.sort()).toEqual([false, true]); expect(await redis!.pttl(key)).toBeLessThanOrEqual(before); expect((await store.read(ticket, secret))?.version).toBe(1); await store.consume(ticket, secret);
	});
	test('independent connections claim exactly one verifier and no grant is stored', async () => {
		const other = new Redis({ path: socket! });
		try {
			const a = new OidcFlowStore(redis!); const b = new OidcFlowStore(other); const ticket = await a.create(flow, secret);
			const results = await Promise.all(Array.from({ length: 8 }, (_, index) => (index % 2 ? a : b).consume(ticket, secret)));
			expect(results.filter(Boolean)).toHaveLength(1); expect(results.find(Boolean)?.flow).toEqual(flow);
		} finally { await other.quit(); }
	});
	test('expired, persistent and corrupt records cannot authorize a verifier', async () => {
		const store = new OidcFlowStore(redis!);
		for (const kind of ['expired', 'persistent', 'corrupt']) {
			const ticket = await store.create(flow, secret); const key = `oidc:flow:v1:${oidcHash(ticket)}`;
			if (kind === 'expired') await redis!.pexpire(key, 0); if (kind === 'persistent') await redis!.persist(key); if (kind === 'corrupt') await redis!.set(key, '{}', 'PX', 1000);
			expect(await store.consume(ticket, secret)).toBeNull(); await redis!.del(key);
		}
	});
});
