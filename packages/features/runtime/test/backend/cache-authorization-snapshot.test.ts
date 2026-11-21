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
