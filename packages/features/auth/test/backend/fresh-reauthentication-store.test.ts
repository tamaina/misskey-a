/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash } from 'node:crypto';
import { lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import { Redis } from 'ioredis';
import { afterAll, describe, expect, test, vi } from 'vitest';
import { FreshReauthenticationStore } from '../../backend/fresh-reauthentication-store.js';

const binding = { userId: 'synthetic-user', sessionId: 'synthetic-session', purpose: 'activate-passkey-mfa' as const };
const record = { ...binding, policyStamp: 'a'.repeat(64), challenge: 'synthetic-challenge' };
const key = (ticket: string) => `fresh-reauth:v1:${createHash('sha256').update(ticket).digest('hex')}`;

test('finite bindings reject unknown purpose/fields and malformed ticket before Redis', async () => {
	const redis = { set: vi.fn(), eval: vi.fn() }; const store = new FreshReauthenticationStore(redis);
	for (const value of [{ ...record, purpose: 'unknown-purpose' }, { ...record, password: 'secret' }, { ...record, policyStamp: 'invalid' }]) {
		await expect(store.create(value as typeof record, 1)).rejects.toThrow();
	}
	expect(await store.consume(binding, 'invalid')).toBeNull();
	for (const ttl of [-1, 0, NaN, 0.5]) await expect(store.create(record, ttl)).rejects.toThrow();
	expect(redis.set).not.toHaveBeenCalled(); expect(redis.eval).not.toHaveBeenCalled();
});

test('sudo is an explicit supported purpose with the same one-use binding', async () => {
	const redis = { eval: vi.fn().mockResolvedValueOnce('OK') }; const store = new FreshReauthenticationStore(redis);
	const value = { ...record, purpose: 'sudo' as const }; const deadline = Date.now() + 90_000;
	const ticket = await store.create(value, deadline);
	expect(ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);
	expect(redis.eval.mock.calls[0].slice(1)).toEqual([1, key(ticket), JSON.stringify({ v: 1, ...value }), String(deadline)]);
	redis.eval.mockResolvedValueOnce([JSON.stringify({ v: 1, ...value }), 1000]);
	expect(await store.consume({ ...binding, purpose: 'sudo' }, ticket)).toEqual({ record: value, remainingMs: 1000 });
	expect(redis.eval.mock.calls[1].slice(1)).toEqual([1, key(ticket), binding.userId, binding.sessionId, 'sudo', '']);
});

test('only email purpose requires a finite target stamp, without changing old records', async () => {
	const redis = { eval: vi.fn() }; const store = new FreshReauthenticationStore(redis);
	for (const value of [{ ...record, purpose: 'update-email' }, { ...record, targetStamp: 'a'.repeat(64) }, { ...record, purpose: 'update-email', targetStamp: 'bad' }]) await expect(store.create(value as typeof record, 1)).rejects.toThrow();
	expect(redis.eval).not.toHaveBeenCalled();
});

const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
if (socket) {
	if (!/^\/tmp\/misskey-oauth-[^/]+\/redis\.sock$/.test(socket)) throw new Error('Fresh reauthentication requires task-owned Unix socket');
	const uid = process.getuid?.(); const directory = lstatSync(dirname(socket)); const endpoint = lstatSync(socket);
	if (uid === undefined || !directory.isDirectory() || directory.uid !== uid || (directory.mode & 0o077) !== 0 || !endpoint.isSocket() || endpoint.uid !== uid) throw new Error('Fresh reauthentication fixture ownership mismatch');
}
const redis = socket ? new Redis({ path: socket, lazyConnect: true }) : undefined;
afterAll(async () => { await redis?.quit(); });

describe.skipIf(!redis)('atomic fresh reauthentication on isolated Redis', () => {
	test('random independent tickets, fixed 90s lifetime and consumed record without plaintext password', async () => {
		const store = new FreshReauthenticationStore(redis!); const a = await store.create(record, await store.startDeadline()); const b = await store.create(record, await store.startDeadline());
		expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/); expect(b).not.toBe(a);
		expect(await redis!.pttl(key(a))).toBeGreaterThan(88_000);
		expect(await redis!.pttl(key(a))).toBeLessThanOrEqual(90_000);
		const result = await store.consume(binding, a);
		expect(result?.record).toEqual(record); expect(result?.remainingMs).toBeLessThanOrEqual(90_000);
		expect(await store.consume(binding, a)).toBeNull();
		expect(await store.consume(binding, b)).not.toBeNull();
	});
	test.each([{ ...binding, userId: 'other' }, { ...binding, sessionId: 'other' }, { ...binding, purpose: 'show-recovery-codes' as const }])('wrong identity/session/purpose does not burn another context (%j)', async wrong => {
		const store = new FreshReauthenticationStore(redis!); const ticket = await store.create(record, await store.startDeadline());
		expect(await store.consume(wrong, ticket)).toBeNull();
		expect((await store.consume(binding, ticket))?.record).toEqual(record);
	});
	test('wrong target digest does not burn the exact email ceremony', async () => {
		const store = new FreshReauthenticationStore(redis!);
		const emailBinding = { ...binding, purpose: 'update-email' as const, targetStamp: 'a'.repeat(64) };
		const emailRecord = { ...record, ...emailBinding };
		const ticket = await store.create(emailRecord, await store.startDeadline());
		expect(await store.consume({ ...emailBinding, targetStamp: 'b'.repeat(64) }, ticket)).toBeNull();
		expect((await store.consume(emailBinding, ticket))?.record).toEqual(emailRecord);
		expect(await store.consume(emailBinding, ticket)).toBeNull();
	});
	test('begin elapsed time shortens Redis TTL instead of granting a new 90 seconds', async () => {
		const store = new FreshReauthenticationStore(redis!); const ticket = await store.create(record, (await store.startDeadline()) - 86_000);
		const result = await store.consume(binding, ticket);
		expect(result?.remainingMs).toBeGreaterThan(0); expect(result?.remainingMs).toBeLessThanOrEqual(4000);
	});
	test('parallel consume across connections obtains exactly one verifier owner', async () => {
		const other = new Redis({ path: socket! });
		try {
			const a = new FreshReauthenticationStore(redis!); const b = new FreshReauthenticationStore(other); const ticket = await a.create(record, await a.startDeadline());
			const results = await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? a : b).consume(binding, ticket)));
			expect(results.filter(Boolean)).toHaveLength(1);
		} finally { await other.quit(); }
	});
	test('expired, missing-TTL and corrupt records fail closed', async () => {
		const store = new FreshReauthenticationStore(redis!);
		const expired = await store.create(record, await store.startDeadline()); await redis!.pexpire(key(expired), 0);
		expect(await store.consume(binding, expired)).toBeNull();
		const noTtl = await store.create(record, await store.startDeadline()); await redis!.persist(key(noTtl));
		expect(await store.consume(binding, noTtl)).toBeNull(); await redis!.del(key(noTtl));
		const corrupt = await store.create(record, await store.startDeadline()); await redis!.set(key(corrupt), 'not-json', 'EX', 90);
		expect(await store.consume(binding, corrupt)).toBeNull(); await redis!.del(key(corrupt));
	});
	test('creation delayed beyond an anchored deadline cannot mint a renewed ticket', async () => {
		const store = new FreshReauthenticationStore(redis!);
		const nearDeadline = (await store.startDeadline()) - 89_990;
		await new Promise(resolve => setTimeout(resolve, 20));
		await expect(store.create(record, nearDeadline)).rejects.toThrow('expired');
		await expect(store.create(record, (await store.startDeadline()) + 1000)).rejects.toThrow('expired');
	});
});
