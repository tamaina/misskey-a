/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomBytes } from 'node:crypto';
import * as v from 'valibot';
import type { Redis } from 'ioredis';

const id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/));
export const freshReauthenticationPurposeSchema = v.picklist(['activate-passkey-mfa', 'show-recovery-codes', 'change-password', 'regenerate-token', 'update-email', 'sudo']);
const bindingEntries = { userId: id, sessionId: id, purpose: freshReauthenticationPurposeSchema, targetStamp: v.exactOptional(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/))) };
const hasExactTarget = (value: { purpose: string; targetStamp?: string }) => (value.purpose === 'update-email') === (value.targetStamp !== undefined);
export const freshReauthenticationBindingSchema = v.pipe(v.strictObject(bindingEntries), v.check(value => hasExactTarget(value)));
const bindingSchema = freshReauthenticationBindingSchema;
const rowSchema = v.pipe(v.strictObject({
	v: v.literal(1), ...bindingEntries,
	policyStamp: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
	challenge: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,1024}$/)),
}), v.check(value => hasExactTarget(value)));
export type FreshReauthenticationBinding = v.InferOutput<typeof bindingSchema>;
export type FreshReauthenticationPurpose = v.InferOutput<typeof freshReauthenticationPurposeSchema>;
export type FreshReauthenticationRecord = Omit<v.InferOutput<typeof rowSchema>, 'v'>;
const key = (ticket: string) => `fresh-reauth:v1:${createHash('sha256').update(ticket).digest('hex')}`;

/** One verifier owner, acquired BEFORE verifying an external assertion.
 * Failed verification burns the challenge. This store issues no grant.
 */
export class FreshReauthenticationStore {
	constructor(private redis: Pick<Redis, 'eval'>) {}

	async startDeadline(): Promise<number> {
		const deadline = await this.redis.eval("local t = redis.call('TIME'); return tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000) + 90000", 0);
		if (typeof deadline !== 'number' || !Number.isSafeInteger(deadline) || deadline <= 0) throw new Error('Fresh reauthentication clock unavailable');
		return deadline;
	}

	async create(value: FreshReauthenticationRecord, expiresAt: number): Promise<string> {
		const row = v.parse(rowSchema, { v: 1, ...value });
		if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) throw new Error('Fresh reauthentication expired');
		const ticket = randomBytes(32).toString('base64url');
		const created = await this.redis.eval(`
local t = redis.call('TIME'); local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local deadline = tonumber(ARGV[2]); if deadline <= now or deadline > now + 90000 then return nil end
return redis.call('SET', KEYS[1], ARGV[1], 'PXAT', ARGV[2], 'NX')
`, 1, key(ticket), JSON.stringify(row), String(expiresAt));
		if (created !== 'OK') throw new Error('Fresh reauthentication expired or collided');
		return ticket;
	}

	async consume(value: FreshReauthenticationBinding, ticket: string): Promise<{ record: FreshReauthenticationRecord; remainingMs: number } | null> {
		const binding = v.parse(bindingSchema, value);
		if (!/^[A-Za-z0-9_-]{43}$/.test(ticket)) return null;
		const result = await this.redis.eval(`
local raw = redis.call('GET', KEYS[1]); local ttl = redis.call('PTTL', KEYS[1])
if not raw or ttl <= 0 or ttl > 90000 then return nil end
local ok, row = pcall(cjson.decode, raw)
if not ok or type(row) ~= 'table' or row.v ~= 1 then return nil end
if row.userId ~= ARGV[1] or row.sessionId ~= ARGV[2] or row.purpose ~= ARGV[3] then return nil end
local target = row.targetStamp or ''; if target ~= ARGV[4] then return nil end
redis.call('DEL', KEYS[1]); return {raw, ttl}
`, 1, key(ticket), binding.userId, binding.sessionId, binding.purpose, binding.targetStamp ?? '');
		if (!Array.isArray(result) || typeof result[0] !== 'string' || !Number.isSafeInteger(result[1]) || result[1] <= 0 || result[1] > 90_000) return null;
		const { v: _v, ...record } = v.parse(rowSchema, JSON.parse(result[0]));
		return { record, remainingMs: result[1] };
	}
}
