/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Redis from 'ioredis';
import { bindThis } from '../decorators.js';

const DELETE_AND_BUMP_GEN_LUA = `
redis.call('DEL', KEYS[1])
local gen = redis.call('INCR', KEYS[2])
redis.call('PEXPIRE', KEYS[2], ARGV[1])
return gen
`;

const SET_IF_GEN_UNCHANGED_LUA = `
local cur = redis.call('GET', KEYS[2])
if (cur == false and ARGV[1] ~= '') or (cur ~= false and cur ~= ARGV[1]) then
	return 0
end
if ARGV[3] == '0' then
	redis.call('SET', KEYS[1], ARGV[2])
else
	redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
end
return 1
`;

export class RedisKVCache<T> {
	private readonly lifetime: number;
	private readonly memoryCache: MemoryKVCache<T>;
	private readonly fetcher: (key: string) => Promise<T>;
	private readonly toRedisConverter: (value: T) => string;
	private readonly fromRedisConverter: (value: string) => T | undefined;
	private readonly inFlight = new Map<string, number>();
	private readonly localGen = new Map<string, number>();

	constructor(
		private redisClient: Redis.Redis,
		private name: string,
		opts: {
			lifetime: RedisKVCache<T>['lifetime'];
			memoryCacheLifetime: number;
			fetcher: RedisKVCache<T>['fetcher'];
			toRedisConverter: RedisKVCache<T>['toRedisConverter'];
			fromRedisConverter: RedisKVCache<T>['fromRedisConverter'];
		},
	) {
		this.lifetime = opts.lifetime;
		this.memoryCache = new MemoryKVCache(opts.memoryCacheLifetime);
		this.fetcher = opts.fetcher;
		this.toRedisConverter = opts.toRedisConverter;
		this.fromRedisConverter = opts.fromRedisConverter;
	}

	private cacheKey(key: string): string {
		return `kvcache:${this.name}:${key}`;
	}

	private genKey(key: string): string {
		return `kvcache:${this.name}:${key}:gen`;
	}

	private genTtlMs(): number {
		return this.lifetime === Infinity ? 1000 * 60 * 60 : Math.max(this.lifetime * 2, 1000 * 60 * 5);
	}

	private bumpLocalGen(key: string): void {
		if (this.inFlight.has(key)) {
			this.localGen.set(key, (this.localGen.get(key) ?? 0) + 1);
		}
	}

	private enterInFlight(key: string): number {
		this.inFlight.set(key, (this.inFlight.get(key) ?? 0) + 1);
		return this.localGen.get(key) ?? 0;
	}

	private leaveInFlight(key: string): void {
		const next = (this.inFlight.get(key) ?? 1) - 1;
		if (next <= 0) {
			this.inFlight.delete(key);
			this.localGen.delete(key);
		} else {
			this.inFlight.set(key, next);
		}
	}

	private async setIfGenUnchanged(
		key: string,
		value: T,
		localGenBefore: number,
		redisGenBefore: string | null | undefined,
	): Promise<void> {
		if ((this.localGen.get(key) ?? 0) !== localGenBefore) return;
		const serialized = this.toRedisConverter(value);
		const ttlSeconds = this.lifetime === Infinity ? '0' : String(Math.max(1, Math.round(this.lifetime / 1000)));
		const written = typeof this.redisClient.eval === 'function'
			? await this.redisClient.eval(
				SET_IF_GEN_UNCHANGED_LUA,
				2,
				this.cacheKey(key),
				this.genKey(key),
				redisGenBefore ?? '',
				serialized,
				ttlSeconds,
			)
			: undefined;
		if (written === undefined) {
			// Fallback for unit-test mocks that stub get/set/del without eval.
			if ((this.localGen.get(key) ?? 0) !== localGenBefore) return;
			this.memoryCache.set(key, value);
			if (this.lifetime === Infinity) {
				await this.redisClient.set(this.cacheKey(key), serialized);
			} else {
				await this.redisClient.set(this.cacheKey(key), serialized, 'EX', Math.round(this.lifetime / 1000));
			}
			return;
		}
		if (written === 1 && (this.localGen.get(key) ?? 0) === localGenBefore) {
			this.memoryCache.set(key, value);
		}
	}

	@bindThis
	public async set(key: string, value: T): Promise<void> {
		this.bumpLocalGen(key);
		this.memoryCache.set(key, value);
		if (this.lifetime === Infinity) {
			await this.redisClient.set(
				this.cacheKey(key),
				this.toRedisConverter(value),
			);
		} else {
			await this.redisClient.set(
				this.cacheKey(key),
				this.toRedisConverter(value),
				'EX', Math.round(this.lifetime / 1000),
			);
		}
	}

	@bindThis
	public async get(key: string): Promise<T | undefined> {
		const memoryCached = this.memoryCache.get(key);
		if (memoryCached !== undefined) return memoryCached;

		const localGenBefore = this.enterInFlight(key);
		try {
			const cached = await this.redisClient.get(this.cacheKey(key));
			if (cached == null) return undefined;

			const value = this.fromRedisConverter(cached);
			if (value !== undefined && (this.localGen.get(key) ?? 0) === localGenBefore) {
				this.memoryCache.set(key, value);
			}

			return value;
		} finally {
			this.leaveInFlight(key);
		}
	}

	@bindThis
	public async delete(key: string): Promise<void> {
		this.bumpLocalGen(key);
		this.memoryCache.delete(key);
		const result = typeof this.redisClient.eval === 'function'
			? await this.redisClient.eval(
				DELETE_AND_BUMP_GEN_LUA,
				2,
				this.cacheKey(key),
				this.genKey(key),
				String(this.genTtlMs()),
			)
			: undefined;
		if (result === undefined) {
			await this.redisClient.del(this.cacheKey(key));
		}
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * This awaits the call to Redis to ensure that the write succeeded, which is important for a few reasons:
	 *   * Other code uses this to synchronize changes between worker processes. A failed write can internally de-sync the cluster.
	 *   * Without an `await`, consecutive calls could race. An unlucky race could result in the older write overwriting the newer value.
	 *   * Not awaiting here makes the entire cache non-consistent. The prevents many possible uses.
	 */
	@bindThis
	public async fetch(key: string, fresh = false): Promise<T> {
		// Authorization snapshots can use the native fetcher without reading or
		// publishing stale shared cache state.
		if (fresh) return this.fetcher(key);
		const cachedValue = await this.get(key);
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const localGenBefore = this.enterInFlight(key);
		try {
			const redisGenBefore = await this.redisClient.get(this.genKey(key));
			const value = await this.fetcher(key);
			await this.setIfGenUnchanged(key, value, localGenBefore, redisGenBefore);
			return value;
		} finally {
			this.leaveInFlight(key);
		}
	}

	@bindThis
	public async refresh(key: string) {
		const localGenBefore = this.enterInFlight(key);
		try {
			const redisGenBefore = await this.redisClient.get(this.genKey(key));
			const value = await this.fetcher(key);
			await this.setIfGenUnchanged(key, value, localGenBefore, redisGenBefore);
		} finally {
			this.leaveInFlight(key);
		}

		// TODO: イベント発行して他プロセスのメモリキャッシュも更新できるようにする
	}

	@bindThis
	public gc() {
		this.memoryCache.gc();
	}

	@bindThis
	public dispose() {
		this.memoryCache.dispose();
	}
}

export class RedisSingleCache<T> {
	private readonly lifetime: number;
	private readonly memoryCache: MemorySingleCache<T>;
	private readonly fetcher: () => Promise<T>;
	private readonly toRedisConverter: (value: T) => string;
	private readonly fromRedisConverter: (value: string) => T | undefined;

	constructor(
		private redisClient: Redis.Redis,
		private name: string,
		opts: {
			lifetime: number;
			memoryCacheLifetime: number;
			fetcher: RedisSingleCache<T>['fetcher'];
			toRedisConverter: RedisSingleCache<T>['toRedisConverter'];
			fromRedisConverter: RedisSingleCache<T>['fromRedisConverter'];
		},
	) {
		this.lifetime = opts.lifetime;
		this.memoryCache = new MemorySingleCache(opts.memoryCacheLifetime);
		this.fetcher = opts.fetcher;
		this.toRedisConverter = opts.toRedisConverter;
		this.fromRedisConverter = opts.fromRedisConverter;
	}

	@bindThis
	public async set(value: T): Promise<void> {
		this.memoryCache.set(value);
		if (this.lifetime === Infinity) {
			await this.redisClient.set(
				`singlecache:${this.name}`,
				this.toRedisConverter(value),
			);
		} else {
			await this.redisClient.set(
				`singlecache:${this.name}`,
				this.toRedisConverter(value),
				'EX', Math.round(this.lifetime / 1000),
			);
		}
	}

	@bindThis
	public async get(): Promise<T | undefined> {
		const memoryCached = this.memoryCache.get();
		if (memoryCached !== undefined) return memoryCached;

		const cached = await this.redisClient.get(`singlecache:${this.name}`);
		if (cached == null) return undefined;

		const value = this.fromRedisConverter(cached);
		if (value !== undefined) {
			this.memoryCache.set(value);
		}

		return value;
	}

	@bindThis
	public async delete(): Promise<void> {
		this.memoryCache.delete();
		await this.redisClient.del(`singlecache:${this.name}`);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * This awaits the call to Redis to ensure that the write succeeded, which is important for a few reasons:
	 *   * Other code uses this to synchronize changes between worker processes. A failed write can internally de-sync the cluster.
	 *   * Without an `await`, consecutive calls could race. An unlucky race could result in the older write overwriting the newer value.
	 *   * Not awaiting here makes the entire cache non-consistent. The prevents many possible uses.
	 */
	@bindThis
	public async fetch(): Promise<T> {
		const cachedValue = await this.get();
		if (cachedValue !== undefined) {
			// Cache HIT
			return cachedValue;
		}

		// Cache MISS
		const value = await this.fetcher();
		await this.set(value);
		return value;
	}

	@bindThis
	public async refresh() {
		const value = await this.fetcher();
		await this.set(value);

		// TODO: イベント発行して他プロセスのメモリキャッシュも更新できるようにする
	}
}

export class MemoryKVCache<T> {
	private readonly cache = new Map<string, { date: number; value: T; }>();
	private readonly gcIntervalHandle = setInterval(() => this.gc(), 1000 * 60 * 3); // 3m

	constructor(
		private readonly lifetime: number,
		private readonly limit: number = Infinity,
	) {}

	@bindThis
	/**
	 * Mapにキャッシュをセットします
	 * @deprecated これを直接呼び出すべきではない。InternalEventなどで変更を全てのプロセス/マシンに通知するべき
	 */
	public set(key: string, value: T): void {
		if (this.limit <= 0) {
			throw new Error('Limit must be greater than 0');
		}

		if (this.limit !== Infinity) {
			this.gc();

			// 挿入順を更新して LRU を保つため、同一キーは一度削除する
			this.cache.delete(key);

			while (this.cache.size >= this.limit) {
				const oldestKey = this.cache.keys().next().value;
				if (oldestKey == null) {
					throw new Error('Cache is empty but size exceeds the limit');
				}
				this.cache.delete(oldestKey);
			}
		}

		this.cache.set(key, {
			date: Date.now(),
			value,
		});
	}

	@bindThis
	public get(key: string): T | undefined {
		const cached = this.cache.get(key);
		if (cached == null) return undefined;
		if ((Date.now() - cached.date) > this.lifetime) {
			this.cache.delete(key);
			return undefined;
		}
		if (this.limit !== Infinity) {
			// access 順を更新して LRU を保つ
			this.cache.delete(key);
			this.cache.set(key, cached);
		}
		return cached.value;
	}

	@bindThis
	public getRaw(key: string): { date: number; value: T; } | undefined {
		return this.cache.get(key);
	}

	@bindThis
	public delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetch(key: string, fetcher: () => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		this.set(key, value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetchMaybe(key: string, fetcher: () => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
		const cachedValue = this.get(key);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			this.set(key, value);
		}
		return value;
	}

	@bindThis
	public gc(): void {
		const now = Date.now();

		for (const [key, { date }] of this.cache.entries()) {
			const age = now - date;
			if (age >= this.lifetime) this.cache.delete(key);
		}
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.gcIntervalHandle);
	}

	public get entries() {
		return this.cache.entries();
	}
}

export class MemorySingleCache<T> {
	private cachedAt: number | null = null;
	private value: T | undefined;

	constructor(
		private lifetime: number,
	) {}

	@bindThis
	public set(value: T): void {
		this.cachedAt = Date.now();
		this.value = value;
	}

	@bindThis
	public get(): T | undefined {
		if (this.cachedAt == null) return undefined;
		if ((Date.now() - this.cachedAt) > this.lifetime) {
			this.value = undefined;
			this.cachedAt = null;
			return undefined;
		}
		return this.value;
	}

	@bindThis
	public delete() {
		this.value = undefined;
		this.cachedAt = null;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetch(fetcher: () => Promise<T>, validator?: (cachedValue: T) => boolean): Promise<T> {
		const cachedValue = this.get();
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		this.set(value);
		return value;
	}

	/**
	 * キャッシュがあればそれを返し、無ければfetcherを呼び出して結果をキャッシュ&返します
	 * optional: キャッシュが存在してもvalidatorでfalseを返すとキャッシュ無効扱いにします
	 */
	@bindThis
	public async fetchMaybe(fetcher: () => Promise<T | undefined>, validator?: (cachedValue: T) => boolean): Promise<T | undefined> {
		const cachedValue = this.get();
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			this.set(value);
		}
		return value;
	}
}
