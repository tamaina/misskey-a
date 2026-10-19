/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes } from 'node:crypto';
import type { Redis } from 'ioredis';
import type { ConfiguredOidcProvider } from './oidc-discovery.js';

export type OidcTransactionPurpose = { mode: 'login' } | { mode: 'link'; localUserId: string; localSessionId: string };
export interface PendingOidcTransaction {
	providerId: string;
	providerVersion: string;
	issuer: string;
	clientId: string;
	purpose: OidcTransactionPurpose;
	nonce: string;
	codeVerifier: string;
}

const TTL_SECONDS = 300;
const opaque = () => randomBytes(32).toString('base64url');
const hash = (value: string) => createHash('sha256').update(value).digest('base64url');
const stateKey = (state: string) => `oidc:transaction:v1:${hash(state)}`;
const validOpaque = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);
const purposeKey = (purpose: OidcTransactionPurpose) => JSON.stringify(purpose.mode === 'login'
	? { mode: 'login' } : { mode: 'link', localUserId: purpose.localUserId, localSessionId: purpose.localSessionId });

function validateBinding(provider: ConfiguredOidcProvider, purpose: OidcTransactionPurpose): void {
	for (const field of [provider.id, provider.version, provider.issuer, provider.clientId]) {
		if (typeof field !== 'string' || !field || field.length > 2048) throw new Error('Invalid OIDC transaction provider');
	}
	if (purpose.mode !== 'login') {
		if (purpose.mode !== 'link') throw new Error('Invalid OIDC transaction purpose');
		for (const field of [purpose.localUserId, purpose.localSessionId]) {
			if (typeof field !== 'string' || !field || field.length > 2048) throw new Error('Invalid OIDC transaction purpose');
		}
	}
}

/** Unconnected storage boundary. Link context must later come from fresh local auth,
 * never client-submitted account IDs. This class does not authenticate or issue grants. */
export class OidcTransactionStore {
	constructor(private redis: Pick<Redis, 'set' | 'eval'>) {}

	async create(provider: ConfiguredOidcProvider, purpose: OidcTransactionPurpose) {
		if (provider.enabled !== true) throw new Error('OIDC provider disabled');
		validateBinding(provider, purpose);
		const state = opaque();
		const browserSecret = opaque();
		const transaction: PendingOidcTransaction = {
			providerId: provider.id, providerVersion: provider.version,
			issuer: provider.issuer, clientId: provider.clientId,
			purpose: purpose.mode === 'login' ? { mode: 'login' } : { mode: 'link', localUserId: purpose.localUserId, localSessionId: purpose.localSessionId },
			nonce: opaque(), codeVerifier: opaque(),
		};
		const stored = { transaction, browserHash: hash(browserSecret), purposeKey: purposeKey(purpose) };
		if (await this.redis.set(stateKey(state), JSON.stringify(stored), 'EX', TTL_SECONDS, 'NX') !== 'OK') throw new Error('OIDC transaction collision');
		return { state, browserSecret, nonce: transaction.nonce,
			codeChallenge: hash(transaction.codeVerifier), codeChallengeMethod: 'S256' as const };
	}

	async consume(provider: ConfiguredOidcProvider, purpose: OidcTransactionPurpose, state: string, browserSecret: string): Promise<PendingOidcTransaction | null> {
		if (provider.enabled !== true || !validOpaque(state) || !validOpaque(browserSecret)) return null;
		validateBinding(provider, purpose);
		const raw = await this.redis.eval(`
local raw = redis.call('GET', KEYS[1]); if not raw then return nil end
if redis.call('PTTL', KEYS[1]) <= 0 then return nil end
local stored = cjson.decode(raw)
local tx = stored.transaction
if stored.browserHash ~= ARGV[1] or tx.providerId ~= ARGV[2]
 or tx.providerVersion ~= ARGV[3] or tx.issuer ~= ARGV[4]
 or tx.clientId ~= ARGV[5] or stored.purposeKey ~= ARGV[6] then return nil end
redis.call('DEL', KEYS[1])
return cjson.encode(tx)
`, 1, stateKey(state), hash(browserSecret), provider.id, provider.version, provider.issuer, provider.clientId, purposeKey(purpose));
		return typeof raw === 'string' ? JSON.parse(raw) as PendingOidcTransaction : null;
	}

	async cancel(provider: ConfiguredOidcProvider, purpose: OidcTransactionPurpose, state: string, browserSecret: string): Promise<boolean> {
		return await this.consume(provider, purpose, state, browserSecret) !== null;
	}
}
