/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { AuthenticationProgressStore, type AuthenticationProgressBinding } from '../../backend/authentication-progress-store.js';

const globalPolicyStamp = 'a'.repeat(64);
const userPolicyStamp = 'b'.repeat(64);
const anonymous: AuthenticationProgressBinding = { purpose: { kind: 'signin' }, globalPolicyStamp, userId: null, userPolicyStamp: null };
const identified: AuthenticationProgressBinding = { ...anonymous, userId: 'synthetic-user', userPolicyStamp };
const proof = { verifiedForUserId: 'synthetic-user', userPolicyStamp, factor: 'password' as const };
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const key = (ticket: string) => `auth-progress:v1:${hash(ticket)}`;

it('rejects malformed, ambiguous and inconsistent server bindings before Redis', async () => {
	const redis = { eval: vi.fn() };
	const store = new AuthenticationProgressStore(redis);
	for (const bad of [
		{ ...anonymous, userId: 'synthetic-user' }, { ...anonymous, userPolicyStamp },
		{ ...identified, purpose: { kind: 'sudo', userId: 'other', sessionId: 'synthetic-session' } },
		{ ...anonymous, purpose: { kind: 'signin', sessionId: 'ambiguous' } },
		{ ...anonymous, purpose: { kind: 'oauth' } }, { ...anonymous, globalPolicyStamp: 'password' },
	]) await expect(store.create(bad as AuthenticationProgressBinding)).rejects.toThrow();
	expect(redis.eval).not.toHaveBeenCalled();
});

it('rejects non-finite proof fields and invalid ticket/nonce/version without a Redis mutation', async () => {
	const redis = { eval: vi.fn() };
	const store = new AuthenticationProgressStore(redis);
	const access = { ticket: 'x'.repeat(43), browserSecret: 'y'.repeat(43) };
	await expect(store.advance(anonymous, access, { nonce: 'z'.repeat(43), version: 0 }, { ...proof, password: 'secret' } as typeof proof)).rejects.toThrow();
	await expect(store.advance(anonymous, access, { nonce: 'z'.repeat(43), version: 0 }, { ...proof, factor: 'backupCode' } as unknown as typeof proof)).rejects.toThrow();
	for (const version of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
		expect(await store.claim(identified, access, { nonce: 'z'.repeat(43), version })).toBeNull();
	}
	expect(await store.read(anonymous, { ...access, ticket: 'invalid' })).toBeNull();
	expect(await store.cancel(identified, access, { nonce: 'invalid', version: 0 })).toBe(false);
	expect(redis.eval).not.toHaveBeenCalled();
});

// Only an explicit task-owned Unix socket is allowed; never connect to a shared Redis.
const socket = process.env.MISSKEY_AUTH_PROGRESS_REDIS_SOCKET;
if (socket) {
	if (!/^\/tmp\/misskey-auth-progress-[^/]+\/redis\.sock$/.test(socket)) throw new Error('Authentication progress fixture requires task-owned Unix socket');
	const uid = process.getuid?.();
	const directory = lstatSync(dirname(socket));
	const endpoint = lstatSync(socket);
	if (uid === undefined || !directory.isDirectory() || directory.uid !== uid || (directory.mode & 0o077) !== 0 || !endpoint.isSocket() || endpoint.uid !== uid) throw new Error('Authentication progress fixture socket ownership mismatch');
}
const redis = socket ? new Redis({ path: socket, lazyConnect: true }) : undefined;
afterAll(async () => { await redis?.quit(); });

describe.skipIf(!redis)('real atomic authentication progress on isolated Redis', () => {
	it('creates independent 256bit secrets, fixed TTL and metadata without plaintext secrets', async () => {
		const store = new AuthenticationProgressStore(redis!);
		const a = await store.create(anonymous); const b = await store.create(anonymous);
		for (const field of ['ticket', 'browserSecret', 'nonce'] as const) {
			expect(a[field]).toMatch(/^[A-Za-z0-9_-]{43}$/); expect(a[field]).not.toBe(b[field]);
		}
		const raw = await redis!.get(key(a.ticket));
		for (const secret of [a.ticket, a.browserSecret, a.nonce]) expect(raw).not.toContain(secret);
		expect(await redis!.ttl(key(a.ticket))).toBeGreaterThan(0);
		expect(await redis!.ttl(key(a.ticket))).toBeLessThanOrEqual(600);
		expect(a.metadata).toMatchObject({ state: 'active', version: 0, userId: null, userPolicyStamp: null, facts: {} });
		const [seconds] = await redis!.time(); expect(Math.abs(a.metadata.createdAt - Number(seconds) * 1000)).toBeLessThan(2000);
		const read = await store.read(anonymous, a);
		for (const field of ['nonce', 'nonceHash', 'browserSecret', 'browserHash', 'ticket', 'purposeKey']) expect(read).not.toHaveProperty(field);
		expect(await store.claim(anonymous, a, a)).toBeNull();
	});

	it('atomically binds the first verified user and policy, never transfers facts', async () => {
		const store = new AuthenticationProgressStore(redis!); const start = await store.create(anonymous);
		const first = await store.advance(anonymous, start, start, proof); expect(first).not.toBeNull();
		expect(first!.metadata).toMatchObject({ userId: identified.userId, userPolicyStamp, facts: { password: expect.any(Number) } });
		expect(await store.read(anonymous, start)).toBeNull();
		expect(await store.advance(identified, start, first!, { ...proof, verifiedForUserId: 'other' })).toBeNull();
		expect(await store.advance(identified, start, first!, { ...proof, userPolicyStamp: 'c'.repeat(64) })).toBeNull();
		const second = await store.advance(identified, start, first!, { ...proof, factor: 'totp' });
		expect(second!.metadata.facts).toEqual({ password: first!.metadata.facts.password, totp: expect.any(Number) });
	});

	it('allows only one competing first bind and one advancing nonce owner', async () => {
		const a = new AuthenticationProgressStore(redis!); const b = new AuthenticationProgressStore(redis!);
		const start = await a.create(anonymous);
		const results = await Promise.all([a.advance(anonymous, start, start, proof), b.advance(anonymous, start, start, { ...proof, verifiedForUserId: 'other' })]);
		expect(results.filter(Boolean)).toHaveLength(1);
		const winner = results.find(Boolean)!; const who = { ...identified, userId: winner.metadata.userId };
		expect(await a.advance(anonymous, start, start, proof)).toBeNull();
		const next = await Promise.all([a.advance(who, start, winner, { ...proof, verifiedForUserId: who.userId!, factor: 'totp' }), b.advance(who, start, winner, { ...proof, verifiedForUserId: who.userId!, factor: 'passkey' })]);
		expect(next.filter(Boolean)).toHaveLength(1);
	});

	it('checks browser, purpose, session, global policy and user policy without burning valid state', async () => {
		const purpose = { kind: 'factor-change', userId: identified.userId!, sessionId: 'synthetic-session' } as const;
		const context = { ...identified, purpose }; const store = new AuthenticationProgressStore(redis!); const start = await store.create(context);
		expect(await store.read(context, { ...start, browserSecret: 'x'.repeat(43) })).toBeNull();
		for (const changed of [
			{ ...context, globalPolicyStamp: 'c'.repeat(64) }, { ...context, userPolicyStamp: 'c'.repeat(64) },
			{ ...context, purpose: { ...purpose, sessionId: 'other' } }, { ...context, purpose: { ...purpose, kind: 'sudo' as const } },
		]) { expect(await store.claim(changed, start, start)).toBeNull(); expect(await store.cancel(changed, start, start)).toBe(false); }
		expect(await store.read(context, start)).not.toBeNull();
	});

	it('preserves the initial expiry across advance and claim, even with suspension', async () => {
		const store = new AuthenticationProgressStore(redis!); const start = await store.create(anonymous);
		await redis!.pexpire(key(start.ticket), 15000);
		const ttl = await redis!.pttl(key(start.ticket));
		const first = await store.advance(anonymous, start, start, proof);
		const claimed = await store.claim(identified, start, first!); expect(claimed).not.toBeNull();
		expect(await redis!.pttl(key(start.ticket))).toBeLessThanOrEqual(ttl);
		await redis!.pexpire(key(start.ticket), 1); await new Promise(resolve => setTimeout(resolve, 10));
		expect(await store.consume(identified, start, claimed!)).toBeNull();
	});

	it('claims once, rejects advance/replay, and consumes metadata once before any external action', async () => {
		const a = new AuthenticationProgressStore(redis!); const b = new AuthenticationProgressStore(redis!);
		const start = await a.create(identified);
		const claims = await Promise.all([a.claim(identified, start, start), b.claim(identified, start, start)]);
		expect(claims.filter(Boolean)).toHaveLength(1); const claimed = claims.find(Boolean)!;
		expect(await a.claim(identified, start, start)).toBeNull(); expect(await a.claim(identified, start, claimed)).toBeNull();
		expect(await a.advance(identified, start, claimed, proof)).toBeNull();
		const consumed = await Promise.all([a.consume(identified, start, claimed), b.consume(identified, start, claimed)]);
		expect(consumed.filter(Boolean)).toHaveLength(1); expect(await redis!.exists(key(start.ticket))).toBe(0);
		expect(await a.consume(identified, start, claimed)).toBeNull();
	});

	it('rejects stale versions/nonces and cannot consume active state', async () => {
		const store = new AuthenticationProgressStore(redis!); const start = await store.create(identified);
		expect(await store.consume(identified, start, start)).toBeNull();
		expect(await store.claim(identified, start, { ...start, version: 1 })).toBeNull();
		expect(await store.claim(identified, start, { ...start, nonce: 'x'.repeat(43) })).toBeNull();
		expect(await store.claim(identified, start, start)).not.toBeNull();
	});

	it.each(['active', 'claimed'] as const)('cancellation of %s makes all late results inert', async state => {
		const store = new AuthenticationProgressStore(redis!); const start = await store.create(identified);
		const step = state === 'claimed' ? (await store.claim(identified, start, start))! : start;
		expect(await store.cancel(identified, start, step)).toBe(true);
		expect(await store.cancel(identified, start, step)).toBe(false);
		expect(await store.advance(identified, start, step, proof)).toBeNull();
		expect(await store.claim(identified, start, step)).toBeNull(); expect(await store.consume(identified, start, step)).toBeNull();
	});

	it('has one terminal winner when cancellation and consumption race', async () => {
		const a = new AuthenticationProgressStore(redis!); const b = new AuthenticationProgressStore(redis!);
		const start = await a.create(identified); const claimed = (await a.claim(identified, start, start))!;
		const [consumed, cancelled] = await Promise.all([a.consume(identified, start, claimed), b.cancel(identified, start, claimed)]);
		expect(Number(consumed !== null) + Number(cancelled)).toBe(1);
		expect(await a.read(identified, start)).toBeNull();
	});
});
