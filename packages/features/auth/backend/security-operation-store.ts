/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { performance } from 'node:perf_hooks';
import { createHash, randomBytes } from 'node:crypto';
import * as v from 'valibot';
import type { Redis } from 'ioredis';

const id = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
const rowSchema = v.strictObject({
	v: v.literal(1), kind: v.picklist(['register-passkey', 'activate-passkey-mfa', 'disable-password-login', 'enable-passwordless-login']),
	userId: id, sessionId: id, policyStamp: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
	sudoUntil: v.pipe(v.number(), v.integer()),
	challenge: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,1024}$/)), requireUV: v.boolean(),
	name: v.nullable(v.pipe(v.string(), v.minLength(1), v.maxLength(30))),
	backupCodes: v.nullable(v.pipe(v.array(v.pipe(v.string(), v.maxLength(128))), v.maxLength(5))),
});
export type SecurityOperation = Omit<v.InferOutput<typeof rowSchema>, 'v'>;
const key = (ticket: string) => `security-operation:v1:${createHash('sha256').update(ticket).digest('hex')}`;

/** One claim before any external proof; no extension, no restoring failed ceremonies. */
export class SecurityOperationStore {
	constructor(private redis: Pick<Redis, 'eval'>) {}
	async create(value: SecurityOperation): Promise<string> {
		const row = v.parse(rowSchema, { v: 1, ...value });
		const remaining = Math.min(90_000, value.sudoUntil - Date.now());
		if (remaining <= 0) throw new Error('Elevation expired');
		const ticket = randomBytes(32).toString('base64url');
		const result = await this.redis.eval(`
local t = redis.call('TIME'); local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local ttl = math.min(90000, tonumber(ARGV[2]) - now, tonumber(ARGV[3]))
if ttl <= 0 then return nil end
return redis.call('SET', KEYS[1], ARGV[1], 'PX', ttl, 'NX')
`, 1, key(ticket), JSON.stringify(row), row.sudoUntil, remaining);
		if (result !== 'OK') throw new Error('Cannot start confirmation');
		return ticket;
	}
	async consume(kind: SecurityOperation['kind'], userId: string, sessionId: string, ticket: string): Promise<SecurityOperation & { expiresAtMonotonic: number }> {
		const started = performance.now();
		if (!/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new Error('Invalid confirmation');
		const raw = await this.redis.eval(`
local raw = redis.call('GET', KEYS[1]); local ttl = redis.call('PTTL', KEYS[1])
if not raw or ttl <= 0 or ttl > 90000 then return nil end
local ok, row = pcall(cjson.decode, raw)
if not ok or type(row) ~= 'table' or row.v ~= 1 or row.kind ~= ARGV[1]
 or row.userId ~= ARGV[2] or row.sessionId ~= ARGV[3] then return nil end
redis.call('DEL', KEYS[1]); return {raw, ttl}
`, 1, key(ticket), kind, userId, sessionId);
		if (!Array.isArray(raw) || typeof raw[0] !== 'string' || !Number.isSafeInteger(raw[1]) || raw[1] <= 0 || raw[1] > 90_000) throw new Error('Confirmation expired or already used');
		const { v: _version, ...row } = v.parse(rowSchema, JSON.parse(raw[0]));
		return { ...row, expiresAtMonotonic: started + raw[1] };
	}
}
