/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createHash, randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';
import type { PendingOidcTransaction } from './oidc-transaction-store.js';

export interface OidcFlow {
	providerId: string;
	providerVersion: string;
	issuer: string;
	subject: string;
	purpose: PendingOidcTransaction['purpose'];
	userId?: string;
	identityId?: string;
	policyStamp?: string;
	registration?: { username: string; passwordHash: string; email: string; codeHash: string; termsStamp: string; invitationCode?: string };
}
export const oidcOpaque = () => randomBytes(32).toString('base64url');
export const oidcHash = (value: string) => createHash('sha256').update(value).digest('hex');
const valid = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
const key = (ticket: string) => `oidc:flow:v1:${oidcHash(ticket)}`;
const CHECK = `
local raw = redis.call('GET', KEYS[1]); local ttl = redis.call('PTTL', KEYS[1])
if not raw or ttl <= 0 or ttl > 300000 then return nil end
local ok, row = pcall(cjson.decode, raw)
if not ok or type(row) ~= 'table' or row.v ~= 1 or row.browserHash ~= ARGV[1] then return nil end
`;

/** Browser-bound continuation; never a credential. Consume before a factor or DB mutation. */
export class OidcFlowStore {
	constructor(private redis: Pick<Redis, 'eval' | 'set'>) {}
	async create(flow: OidcFlow, browserSecret: string, ticket = oidcOpaque()) {
		if (!valid(ticket) || !valid(browserSecret) || await this.redis.set(key(ticket), JSON.stringify({ v: 1, browserHash: oidcHash(browserSecret), version: 0, flow }), 'EX', 300, 'NX') !== 'OK') throw new Error('OIDC continuation unavailable');
		return ticket;
	}
	async read(ticket: string, browserSecret: string): Promise<{ flow: OidcFlow; version: number } | null> {
		if (!valid(ticket) || !valid(browserSecret)) return null;
		const raw = await this.redis.eval(CHECK + 'return cjson.encode(row)', 1, key(ticket), oidcHash(browserSecret));
		return typeof raw === 'string' ? JSON.parse(raw) : null;
	}
	async update(ticket: string, browserSecret: string, version: number, flow: OidcFlow): Promise<boolean> {
		if (!valid(ticket) || !valid(browserSecret) || !Number.isSafeInteger(version)) return false;
		return await this.redis.eval(CHECK + `
if row.version ~= tonumber(ARGV[2]) then return nil end
row.version = row.version + 1; row.flow = cjson.decode(ARGV[3])
redis.call('SET', KEYS[1], cjson.encode(row), 'KEEPTTL'); return 1
`, 1, key(ticket), oidcHash(browserSecret), version, JSON.stringify(flow)) === 1;
	}
	async consume(ticket: string, browserSecret: string): Promise<{ flow: OidcFlow; remainingMs: number } | null> {
		if (!valid(ticket) || !valid(browserSecret)) return null;
		const raw = await this.redis.eval(CHECK + "redis.call('DEL', KEYS[1]); return {cjson.encode(row.flow), ttl}", 1, key(ticket), oidcHash(browserSecret));
		if (!Array.isArray(raw) || typeof raw[0] !== 'string' || !Number.isSafeInteger(raw[1]) || raw[1] <= 0 || raw[1] > 300_000) return null;
		return { flow: JSON.parse(raw[0]), remainingMs: raw[1] };
	}
}
