/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { RedisKVCache } from '../../backend/cache/cache.js';
import type * as Redis from 'ioredis';
it('reads a fresh authorization snapshot through the native fetcher without using or publishing shared cache state', async () => {
	const redis = mockDeep<Redis.Redis>(); const fetcher = vi.fn(async () => new Set<string>());
	const cache = new RedisKVCache(redis, 'synthetic', { lifetime: 10000, memoryCacheLifetime: 10000, fetcher,
		toRedisConverter: value => JSON.stringify([...value]), fromRedisConverter: value => new Set(JSON.parse(value)) });
	try {
		await cache.set('viewer', new Set(['revoked-follow'])); redis.set.mockClear(); redis.get.mockClear();
		expect(await cache.fetch('viewer')).toEqual(new Set(['revoked-follow'])); expect(fetcher).not.toHaveBeenCalled();
		expect(await cache.fetch('viewer', true)).toEqual(new Set()); expect(fetcher).toHaveBeenCalledWith('viewer');
		expect(redis.get).not.toHaveBeenCalled(); expect(redis.set).not.toHaveBeenCalled();
		expect(await cache.fetch('viewer')).toEqual(new Set(['revoked-follow']));
	} finally { cache.dispose(); }
});

it('does not repopulate Redis or memory cache when another worker invalidates during an in-flight fetch', async () => {
	const store = new Map<string, string>();
	const redis = mockDeep<Redis.Redis>();
	redis.get.mockImplementation(async key => store.get(String(key)) ?? null);
	redis.eval.mockImplementation((async (script: string, _numKeys: number, cacheKey: string, genKey: string, ...args: string[]) => {
		if (script.includes("redis.call('INCR'")) {
			store.delete(cacheKey);
			const next = String(Number(store.get(genKey) ?? '0') + 1);
			store.set(genKey, next);
			return Number(next);
		}
		const [expectedGen, serialized] = args;
		const cur = store.get(genKey) ?? '';
		if (cur !== expectedGen) return 0;
		store.set(cacheKey, serialized);
		return 1;
	}) as unknown as Redis.Redis['eval']);

	let finishStaleFetch!: () => void;
	let startedResolve!: () => void;
	const started = new Promise<void>(resolve => { startedResolve = resolve; });
	let currentFollows = new Set(['alice']);

	const workerA = new RedisKVCache(redis, 'activeUserFollowings', {
		lifetime: 10000,
		memoryCacheLifetime: 10000,
		fetcher: async () => {
			const snapshot = new Set(currentFollows);
			startedResolve();
			await new Promise<void>(resolve => { finishStaleFetch = resolve; });
			return snapshot;
		},
		toRedisConverter: value => JSON.stringify([...value]),
		fromRedisConverter: value => new Set(JSON.parse(value)),
	});
	const workerB = new RedisKVCache(redis, 'activeUserFollowings', {
		lifetime: 10000,
		memoryCacheLifetime: 10000,
		fetcher: async () => new Set(currentFollows),
		toRedisConverter: value => JSON.stringify([...value]),
		fromRedisConverter: value => new Set(JSON.parse(value)),
	});

	try {
		const stalePromise = workerA.fetch('owner');
		await started;

		// Worker B processes unfollow and invalidates Redis before Worker A's fetch completes.
		currentFollows = new Set();
		await workerB.delete('owner');

		finishStaleFetch();
		expect(await stalePromise).toEqual(new Set(['alice']));
		// Neither Redis nor Worker A's memory cache should hold the stale follow.
		expect(store.has('kvcache:activeUserFollowings:owner')).toBe(false);
		expect(await workerB.fetch('owner')).toEqual(new Set());
	} finally {
		workerA.dispose();
		workerB.dispose();
	}
});
