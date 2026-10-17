/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';
import * as v from 'valibot';

const id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/));
const stamp = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
const integer = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(Number.MAX_SAFE_INTEGER));
const purposeSchema = v.variant('kind', [
	v.strictObject({ kind: v.literal('signin') }),
	v.strictObject({ kind: v.literal('sudo'), userId: id, sessionId: id }),
	v.strictObject({ kind: v.literal('factor-change'), userId: id, sessionId: id }),
]);
const bindingSchema = v.strictObject({
	purpose: purposeSchema, globalPolicyStamp: stamp,
	userId: v.nullable(id), userPolicyStamp: v.nullable(stamp),
});
const factorSchema = v.picklist(['password', 'totp', 'passkey']);
const proofSchema = v.strictObject({ verifiedForUserId: id, userPolicyStamp: stamp, factor: factorSchema });
const factsSchema = v.strictObject({ password: v.exactOptional(integer), totp: v.exactOptional(integer), passkey: v.exactOptional(integer) });
const storedSchema = v.strictObject({
	v: v.literal(1), purpose: purposeSchema, purposeKey: v.string(),
	globalPolicyStamp: stamp, userId: v.nullable(id), userPolicyStamp: v.nullable(stamp),
	browserHash: v.string(), nonceHash: v.string(), version: integer,
	state: v.picklist(['active', 'claimed']), createdAt: integer, facts: factsSchema,
});

export type AuthenticationProgressPurpose = v.InferOutput<typeof purposeSchema>;
export type AuthenticationProgressBinding = v.InferOutput<typeof bindingSchema>;
export type AuthenticationProgressProof = v.InferOutput<typeof proofSchema>;
export type AuthenticationProgressMetadata = Omit<v.InferOutput<typeof storedSchema>, 'browserHash' | 'nonceHash' | 'purposeKey' | 'v'>;
export interface AuthenticationProgressAccess { ticket: string; browserSecret: string; }
export interface AuthenticationProgressStep { version: number; nonce: string; }

const opaque = () => randomBytes(32).toString('base64url');
const validOpaque = (value: string) => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const key = (ticket: string) => `auth-progress:v1:${hash(ticket)}`;
const purposeKey = (purpose: AuthenticationProgressPurpose) => JSON.stringify(purpose.kind === 'signin'
	? { kind: 'signin' } : { kind: purpose.kind, userId: purpose.userId, sessionId: purpose.sessionId });

function binding(value: AuthenticationProgressBinding): AuthenticationProgressBinding {
	const parsed = v.parse(bindingSchema, value);
	if ((parsed.userId === null) !== (parsed.userPolicyStamp === null)
		|| (parsed.purpose.kind !== 'signin' && parsed.purpose.userId !== parsed.userId)) throw new Error('Invalid authentication progress identity');
	return parsed;
}

function metadata(raw: string): AuthenticationProgressMetadata {
	const { v: _v, browserHash: _browserHash, nonceHash: _nonceHash, purposeKey: _purposeKey, ...result } = v.parse(storedSchema, JSON.parse(raw));
	return result;
}

// Every mutation checks both the expected identity snapshot and nonce/version.
// Redis TIME provides audit timestamps; PTTL and KEEPTTL preserve the original deadline.
const CHECK = `
local raw = redis.call('GET', KEYS[1]); if not raw or redis.call('PTTL', KEYS[1]) <= 0 then return nil end
local ok, row = pcall(cjson.decode, raw); if not ok or type(row) ~= 'table' or row.v ~= 1 then return nil end
local expectedUser = ARGV[4] == '' and cjson.null or ARGV[4]
local expectedPolicy = ARGV[5] == '' and cjson.null or ARGV[5]
if row.browserHash ~= ARGV[1] or row.purposeKey ~= ARGV[2] or row.globalPolicyStamp ~= ARGV[3]
 or row.userId ~= expectedUser or row.userPolicyStamp ~= expectedPolicy then return nil end
`;
const CAS = `
if row.version ~= tonumber(ARGV[6]) or row.nonceHash ~= ARGV[7] or row.version >= 9007199254740991 then return nil end
`;
const SAVE = `redis.call('SET', KEYS[1], cjson.encode(row), 'KEEPTTL'); return cjson.encode(row)`;

/** Metadata storage, never an authentication verifier or grant issuer.
 * Callers supply server-owned bindings and already verified proof metadata.
 * A controller must claim BEFORE a consumable verifier; the claimed nonce is a
 * private verifier-owner receipt, never returned to the browser. finishClaim
 * records that owner's verified factor. Current policy/fresh proofs and active
 * session ownership for non-signin purposes remain controller responsibilities.
 * Redis timestamps audit metadata arrival rather than proof freshness. Consume
 * deletes BEFORE the grant: a crash burns a ticket, without Redis/DB exactly-once.
 * Losing a nonce requires a fresh start; expiry is never extended.
 */
export class AuthenticationProgressStore {
	constructor(private redis: Pick<Redis, 'eval'>) {}

	async create(value: AuthenticationProgressBinding): Promise<AuthenticationProgressAccess & AuthenticationProgressStep & { metadata: AuthenticationProgressMetadata }> {
		const context = binding(value);
		const access = { ticket: opaque(), browserSecret: opaque() };
		const nonce = opaque();
		const row = { v: 1, ...context, purposeKey: purposeKey(context.purpose), browserHash: hash(access.browserSecret), nonceHash: hash(nonce), version: 0, state: 'active', createdAt: 0, facts: {} };
		const raw = await this.redis.eval(`
local row = cjson.decode(ARGV[1]); local time = redis.call('TIME')
row.createdAt = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local encoded = cjson.encode(row)
if not redis.call('SET', KEYS[1], encoded, 'EX', 600, 'NX') then return nil end
return encoded
`, 1, key(access.ticket), JSON.stringify(row));
		if (typeof raw !== 'string') throw new Error('Authentication progress collision');
		return { ...access, nonce, version: 0, metadata: metadata(raw) };
	}

	private args(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess): string[] | null {
		const checked = binding(context);
		if (!validOpaque(access.ticket) || !validOpaque(access.browserSecret)) return null;
		return [hash(access.browserSecret), purposeKey(checked.purpose), checked.globalPolicyStamp, checked.userId ?? '', checked.userPolicyStamp ?? ''];
	}

	private casArgs(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, step: AuthenticationProgressStep): string[] | null {
		const args = this.args(context, access);
		if (!args || !validOpaque(step.nonce) || !Number.isSafeInteger(step.version) || step.version < 0) return null;
		return [...args, String(step.version), hash(step.nonce)];
	}

	async read(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess): Promise<AuthenticationProgressMetadata | null> {
		const args = this.args(context, access); if (!args) return null;
		const raw = await this.redis.eval(CHECK + 'return raw', 1, key(access.ticket), ...args);
		return typeof raw === 'string' ? metadata(raw) : null;
	}

	async advance(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, step: AuthenticationProgressStep, verified: AuthenticationProgressProof): Promise<(AuthenticationProgressStep & { metadata: AuthenticationProgressMetadata }) | null> {
		const proof = v.parse(proofSchema, verified);
		const args = this.casArgs(context, access, step); if (!args) return null;
		const nonce = opaque();
		const raw = await this.redis.eval(CHECK + CAS + `
if row.state ~= 'active' then return nil end
if row.userId ~= cjson.null and (row.userId ~= ARGV[8] or row.userPolicyStamp ~= ARGV[9]) then return nil end
row.userId = ARGV[8]; row.userPolicyStamp = ARGV[9]
local time = redis.call('TIME')
row.facts[ARGV[10]] = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
row.version = row.version + 1; row.nonceHash = ARGV[11]
` + SAVE, 1, key(access.ticket), ...args, proof.verifiedForUserId, proof.userPolicyStamp, proof.factor, hash(nonce));
		if (typeof raw !== 'string') return null;
		const result = metadata(raw); return { nonce, version: result.version, metadata: result };
	}

	async claim(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, step: AuthenticationProgressStep): Promise<(AuthenticationProgressStep & { metadata: AuthenticationProgressMetadata }) | null> {
		const args = this.casArgs(context, access, step); if (!args) return null;
		const nonce = opaque();
		const raw = await this.redis.eval(CHECK + CAS + `
if row.state ~= 'active' or row.userId == cjson.null then return nil end
row.state = 'claimed'; row.version = row.version + 1; row.nonceHash = ARGV[8]
` + SAVE, 1, key(access.ticket), ...args, hash(nonce));
		if (typeof raw !== 'string') return null;
		const result = metadata(raw); return { nonce, version: result.version, metadata: result };
	}

	/** Only the private owner of a claimed step may finish a consumable verifier. */
	async finishClaim(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, owner: AuthenticationProgressStep, verified: AuthenticationProgressProof): Promise<(AuthenticationProgressStep & { metadata: AuthenticationProgressMetadata }) | null> {
		const proof = v.parse(proofSchema, verified);
		const args = this.casArgs(context, access, owner); if (!args) return null;
		const nonce = opaque();
		const raw = await this.redis.eval(CHECK + CAS + `
if row.state ~= 'claimed' or row.userId ~= ARGV[8] or row.userPolicyStamp ~= ARGV[9] then return nil end
local time = redis.call('TIME')
row.facts[ARGV[10]] = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
row.version = row.version + 1; row.nonceHash = ARGV[11]
` + SAVE, 1, key(access.ticket), ...args, proof.verifiedForUserId, proof.userPolicyStamp, proof.factor, hash(nonce));
		if (typeof raw !== 'string') return null;
		const result = metadata(raw); return { nonce, version: result.version, metadata: result };
	}

	async consume(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, step: AuthenticationProgressStep): Promise<AuthenticationProgressMetadata | null> {
		const args = this.casArgs(context, access, step); if (!args) return null;
		const raw = await this.redis.eval(CHECK + CAS + `
if row.state ~= 'claimed' then return nil end
redis.call('DEL', KEYS[1]); return raw
`, 1, key(access.ticket), ...args);
		return typeof raw === 'string' ? metadata(raw) : null;
	}

	async cancel(context: AuthenticationProgressBinding, access: AuthenticationProgressAccess, step: AuthenticationProgressStep): Promise<boolean> {
		const args = this.casArgs(context, access, step); if (!args) return false;
		return await this.redis.eval(CHECK + CAS + `
if row.state ~= 'active' and row.state ~= 'claimed' then return nil end
redis.call('DEL', KEYS[1]); return 1
`, 1, key(access.ticket), ...args) === 1;
	}
}
