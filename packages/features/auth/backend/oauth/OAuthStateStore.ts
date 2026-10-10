/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import type * as Redis from 'ioredis';

const TTL_SECONDS = 300;

/** Shared, short-lived authorization state. Never stores access-token credentials. */
export class OAuthStateStore {
	constructor(private redis: Redis.Redis) {}

	private key(kind: string, secret: string): string {
		return `oauth:${kind}:${createHash('sha256').update(secret).digest('hex')}`;
	}

	async putTransaction<T>(id: string, value: T): Promise<void> {
		if (await this.redis.set(this.key('transaction', id), JSON.stringify(value), 'EX', TTL_SECONDS, 'NX') !== 'OK') {
			throw new Error('Authorization transaction collision');
		}
	}

	async takeTransaction<T>(id: string): Promise<T | null> {
		const value = await this.redis.eval(`local v = redis.call('GET', KEYS[1]); redis.call('DEL', KEYS[1]); return v`, 1, this.key('transaction', id));
		return typeof value === 'string' ? JSON.parse(value) as T : null;
	}

	async putCode<T>(code: string, grant: T): Promise<void> {
		if (await this.redis.set(this.key('code', code), JSON.stringify({ grant, used: false, revoked: false }), 'EX', TTL_SECONDS, 'NX') !== 'OK') {
			throw new Error('Authorization code collision');
		}
	}

	async claimCode<T>(code: string): Promise<{ grant?: T; replayTokenId?: string; claimed: boolean }> {
		const value = await this.redis.eval(`
local raw = redis.call('GET', KEYS[1]); if not raw then return nil end
local state = cjson.decode(raw)
if state.used then
 state.revoked = true
 redis.call('SET', KEYS[1], cjson.encode(state), 'KEEPTTL')
 return cjson.encode({ claimed = false, replayTokenId = state.tokenId })
end
state.used = true
redis.call('SET', KEYS[1], cjson.encode(state), 'KEEPTTL')
return cjson.encode({ claimed = true, grant = state.grant })
`, 1, this.key('code', code));
		return typeof value === 'string' ? JSON.parse(value) : { claimed: false };
	}

	/** Bind the row before insertion and recheck afterward; replay/expiry fails closed. */
	async publishToken(code: string, tokenId: string): Promise<boolean> {
		return await this.redis.eval(`
local raw = redis.call('GET', KEYS[1]); if not raw then return 0 end
local state = cjson.decode(raw)
if state.revoked or not state.used then return 0 end
if state.tokenId and state.tokenId ~= ARGV[1] then return 0 end
state.tokenId = ARGV[1]
redis.call('SET', KEYS[1], cjson.encode(state), 'KEEPTTL')
return 1
`, 1, this.key('code', code), tokenId) === 1;
	}
}
