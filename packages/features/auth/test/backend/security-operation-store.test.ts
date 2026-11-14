/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { SecurityOperationStore } from '../../backend/security-operation-store.js';
import type { SecurityOperation } from '../../backend/security-operation-store.js';

const operation: SecurityOperation = {
	kind: 'enable-passwordless-login', userId: 'synthetic-user', sessionId: 'synthetic-session',
	policyStamp: 'a'.repeat(64), sudoUntil: null, sudoGrantId: null,
	challenge: 'AQID', requireUV: true, name: null, backupCodes: null,
};

test('passwordless proof gets its own bounded ticket lifetime without a sudo grant', async () => {
	const evalRedis = vi.fn(async () => 'OK');
	const store = new SecurityOperationStore({ eval: evalRedis } as never);
	const before = Date.now();
	const ticket = await store.create(operation);
	expect(ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);
	const args = evalRedis.mock.calls[0] as unknown as unknown[];
	expect(JSON.parse(String(args[3]))).toMatchObject(operation);
	expect(Number(args[4])).toBeGreaterThanOrEqual(before + 90_000);
	expect(Number(args[4])).toBeLessThanOrEqual(Date.now() + 90_000);
	expect(Number(args[5])).toBeLessThanOrEqual(90_000);
	expect(args[0]).toContain('math.min(90000');
	// Other operations still require a valid elevation deadline.
	await expect(store.create({ ...operation, kind: 'register-passkey' })).rejects.toThrow('Elevation required');
	expect(evalRedis).toHaveBeenCalledOnce();
});

test('claim is tied to operation, user and session and consumes before returning the proof', async () => {
	const evalRedis = vi.fn(async () => [JSON.stringify({ v: 1, ...operation }), 1000]);
	const store = new SecurityOperationStore({ eval: evalRedis } as never);
	const row = await store.consume(operation.kind, operation.userId, operation.sessionId, 'x'.repeat(43));
	expect(row).toMatchObject(operation); expect(row.expiresAtMonotonic).toBeGreaterThan(0);
	const args = evalRedis.mock.calls[0] as unknown as unknown[];
	expect(args.slice(3)).toEqual([operation.kind, operation.userId, operation.sessionId]);
	expect(args[0]).toContain("redis.call('DEL', KEYS[1])");
	expect(args[0]).toContain('row.sessionId ~= ARGV[3]');
});
