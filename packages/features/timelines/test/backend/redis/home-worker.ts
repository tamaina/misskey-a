/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { expect, vi } from 'vitest';
import { Redis } from 'ioredis';
import { mockDeep } from 'vitest-mock-extended';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { AntennaService } from '../../../backend/services/AntennaService.js';
import type { FollowingsRepository, MiFollowing } from '@features/persistence/backend/repositories/models.js';
import type { MiAntenna } from '../../../backend/models/Antenna.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

export async function checkWorker(role: 'first' | 'second') {
	const socket = process.env.MISSKEY_OAUTH_REDIS_SOCKET;
	if (!socket?.includes('/misskey-oauth-')) throw new Error('Disposable fixture Redis socket required');
	const redis = new Redis({ path: socket });
	const sub = new Redis({ path: socket });
	const repository = mockDeep<FollowingsRepository>();
	// Only the repository is synthetic. Both process-local caches, the shared Redis
	// cache and pubsub messages use production code and independent connections.
	repository.find.mockImplementation(async options => {
		const owner = (options?.where as { followerId: string }).followerId;
		return JSON.parse(await redis.get(`fixture:following:${owner}`) ?? '[]').map((followeeId: string) => ({ followeeId, withReplies: false } as MiFollowing));
	});
	const cache = new CacheService(redis, sub, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), repository, mockDeep());
	const service = new AntennaService(redis, sub, mockDeep(), mockDeep(), cache, mockDeep(), mockDeep(), mockDeep());
	const antenna = { userId: 'owner', src: 'home', keywords: [['needle']], excludeKeywords: [], withReplies: true, users: [] } as unknown as MiAntenna;
	const note = { userId: 'author', text: 'needle', visibility: 'public', fileIds: [] } as unknown as MiNote;
	const author = { id: 'author', username: 'author', host: null, isBot: false };
	const hit = () => service.checkHitAntenna(antenna, note, author);
	const wait = async (key: string, value: string) => vi.waitFor(async () => expect(await redis.get(key)).toBe(value), { timeout: 5000, interval: 10 });
	try {
		await sub.subscribe('fixture:internal');
		await redis.set(`fixture:pid:${role}`, process.pid);
		if (role === 'first') {
			await redis.set('fixture:following:owner', '[]');
			await redis.set('fixture:initialized', 'yes');
		}
		await wait('fixture:initialized', 'yes');
		expect(await hit()).toBe(false);
		await redis.set(`fixture:warm:${role}`, 'yes');
		await wait('fixture:warm:first', 'yes');
		await wait('fixture:warm:second', 'yes');
		expect(await redis.get('fixture:pid:first')).not.toBe(await redis.get('fixture:pid:second'));
		for (const [index, type, expected] of [[1, 'follow', true], [2, 'unfollow', false], [3, 'follow', true]] as const) {
			if (role === 'first') {
				await redis.set('fixture:following:owner', JSON.stringify(expected ? ['author'] : []));
				await cache.userFollowingsCache.refresh('owner');
				await redis.publish('fixture:internal', JSON.stringify({ channel: 'internal', message: { type, body: { followerId: 'owner', followeeId: 'author' } } }));
				await redis.set('fixture:phase', String(index));
			}
			await wait('fixture:phase', String(index));
			await vi.waitFor(async () => expect(await hit()).toBe(expected), { timeout: 2000, interval: 10 });
			await redis.set(`fixture:ack:${role}`, String(index));
			await wait('fixture:ack:first', String(index));
			await wait('fixture:ack:second', String(index));
		}
		console.log(`Redis home antenna worker ${role}, PID ${process.pid}: warmed cache, follow, unfollow, refollow passed`);
	} finally {
		service.dispose(); cache.dispose();
		await Promise.all([redis.quit(), sub.quit()]);
	}
}
