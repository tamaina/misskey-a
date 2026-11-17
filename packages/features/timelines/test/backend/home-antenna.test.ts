/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'node:events';
import { afterEach, expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { Redis } from 'ioredis';
import { AntennaService } from '../../backend/services/AntennaService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import type { FollowingsRepository, MiFollowing } from '@features/persistence/backend/repositories/models.js';
import type { MiAntenna } from '../../backend/models/Antenna.js';
import type { MiNote } from '@features/notes/backend/models/Note.js';

const disposers: (() => void)[] = [];
afterEach(() => disposers.splice(0).forEach(dispose => dispose()));

function fixture() {
	const records = new Map<string, string>();
	const redis = mockDeep<Redis>();
	redis.get.mockImplementation(async key => records.get(String(key)) ?? null);
	redis.set.mockImplementation(async (key, value) => { records.set(String(key), String(value)); return 'OK'; });
	redis.del.mockImplementation(async key => Number(records.delete(String(key))));
	const events = new EventEmitter();
	const following = new Set<string>();
	const followings = mockDeep<FollowingsRepository>();
	followings.find.mockImplementation(async () => [...following].map(followeeId => ({ followeeId, withReplies: false } as MiFollowing)));
	const clients = Array.from({ length: 2 }, () => {
		const cache = new CacheService(redis, events as unknown as Redis, mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), followings, mockDeep());
		const service = new AntennaService(redis, events as unknown as Redis, mockDeep(), mockDeep(), cache, mockDeep(), mockDeep(), mockDeep());
		disposers.push(() => { service.dispose(); cache.dispose(); });
		return { cache, service };
	});
	const antenna = { id: 'antenna', userId: 'owner', src: 'home', keywords: [['needle']], excludeKeywords: [], withReplies: true, withFile: false, users: [] } as unknown as MiAntenna;
	const note = { id: 'note', userId: 'author', visibility: 'public', text: 'Needle', cw: null, fileIds: [], replyId: null } as unknown as MiNote;
	const author = { id: 'author', username: 'alice', host: null, isBot: false };
	const hit = (index = 0) => clients[index].service.checkHitAntenna(antenna, note, author);
	const publish = async (type: 'follow' | 'unfollow') => {
		const message = JSON.stringify({ channel: 'internal', message: { type, body: { followerId: 'owner', followeeId: 'author' } } });
		for (const listener of events.listeners('message')) await listener('internal', message);
	};
	return { following, followings, clients, antenna, note, author, hit, publish };
}

test('only current followees match, including across two warmed worker caches after follow/unfollow', async () => {
	const f = fixture();
	expect(await f.hit()).toBe(false);
	expect(await f.hit(1)).toBe(false);
	f.following.add('author');
	await f.publish('follow');
	expect(await f.hit()).toBe(true);
	expect(await f.hit(1)).toBe(true);
	f.following.delete('author');
	await f.publish('unfollow');
	expect(await f.hit()).toBe(false);
	expect(await f.hit(1)).toBe(false);
	expect(f.followings.find).toHaveBeenCalledWith({ where: { followerId: 'owner', isFollowerSuspended: false }, select: { followeeId: true, withReplies: true } });
});

test('does not implicitly include the owner or inherited object keys', async () => {
	const f = fixture();
	for (const userId of ['owner', 'toString', 'constructor']) {
		f.note.userId = userId;
		expect(await f.hit()).toBe(false);
	}
});

test('all-source antennas retain their existing behavior', async () => {
	const f = fixture();
	f.antenna.src = 'all';
	expect(await f.hit()).toBe(true);
});

test.each([
	['keyword mismatch', { text: 'different' }, {}, {}, false],
	['CW keyword', { text: null, cw: 'needle' }, {}, {}, true],
	['excluded keyword', { text: 'needle excluded' }, { excludeKeywords: [['excluded']] }, {}, false],
	['case-sensitive mismatch', {}, { caseSensitive: true }, {}, false],
	['reply disabled', { replyId: 'parent' }, { withReplies: false }, {}, false],
	['file required', {}, { withFile: true }, {}, false],
	['file attached', { fileIds: ['file'] }, { withFile: true }, {}, true],
	['remote excluded', {}, { localOnly: true }, { host: 'remote.test' }, false],
	['bot excluded', {}, { excludeBots: true }, { isBot: true }, false],
	['sensitive channel', { channel: { isSensitive: true } }, { excludeNotesInSensitiveChannel: true }, {}, false],
	['specified nonrecipient', { visibility: 'specified', visibleUserIds: ['other'] }, {}, {}, false],
	['specified recipient', { visibility: 'specified', visibleUserIds: ['owner'] }, {}, {}, true],
	['followers visibility', { visibility: 'followers' }, {}, {}, true],
] as const)('preserves existing conditions: %s', async (_name, note, antenna, author, expected) => {
	const f = fixture();
	f.following.add('author');
	Object.assign(f.note, note); Object.assign(f.antenna, antenna); Object.assign(f.author, author);
	expect(await f.hit()).toBe(expected);
});
