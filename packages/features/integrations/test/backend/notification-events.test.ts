/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import 'reflect-metadata';
import { beforeEach, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { NotificationEntityService } from '@features/notifications/backend/serializers/NotificationEntityService.js';
import { notificationTypes } from '@features/notifications/backend/notification-types.schema.js';
import { notificationEventName, webhookEventTypes } from '../../backend/webhook-events.schema.js';
import type { MiNotification } from '@features/notifications/backend/models/Notification.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

const pending = vi.hoisted(() => ({ promises: [] as Promise<unknown>[], delay: vi.fn() }));
vi.mock('@features/runtime/backend/async/promise-tracker.js', () => ({ trackPromise: (promise: Promise<unknown>) => pending.promises.push(promise) }));
vi.mock('node:timers/promises', () => ({ setTimeout: (...args: unknown[]) => { pending.delay(...args); return Promise.resolve(); } }));
vi.mock('@features/integrations/backend/services/UserWebhookService.js', () => ({ UserWebhookService: class {} }));
vi.mock('@features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('@features/notifications/backend/services/PushNotificationService.js', () => ({ PushNotificationService: class {} }));
vi.mock('@features/runtime/backend/services/IdService.js', () => ({ IdService: class {} }));
vi.mock('@features/users/backend/services/CacheService.js', () => ({ CacheService: class {} }));
vi.mock('@features/relationships/backend/services/UserListService.js', () => ({ UserListService: class {} }));
vi.mock('@features/roles/backend/serializers/RoleEntityService.js', () => ({ RoleEntityService: class {} }));
vi.mock('@features/chat/backend/serializers/ChatEntityService.js', () => ({ ChatEntityService: class {} }));

beforeEach(() => { pending.promises.length = 0; pending.delay.mockClear(); });
const note = { id: 'note', userId: 'author' } as Packed<'Note'>;
const user = { id: 'author' } as Packed<'UserLite'>;
const createdAt = '2026-10-23T00:00:00.000Z';

function fixture() {
	type Args = ConstructorParameters<typeof NotificationService>;
	const config = mockDeep<Args[0]>({ perUserNotificationsMaxCount: 100 });
	const redis = mockDeep<Args[1]>(); const users = mockDeep<Args[2]>();
	const serializer = mockDeep<Args[3]>(); const ids = mockDeep<Args[4]>();
	const events = mockDeep<Args[5]>(); const push = mockDeep<Args[6]>();
	const cache = mockDeep<Args[7]>(); const lists = mockDeep<Args[8]>(); const webhooks = mockDeep<Args[9]>();
	cache.userProfileCache.fetch.mockResolvedValue({ notificationRecieveConfig: {} } as never);
	cache.userMutingsCache.fetch.mockResolvedValue(new Set());
	cache.userFollowingsCache.fetch.mockResolvedValue({});
	ids.gen.mockReturnValue('notification'); ids.parseFull.mockReturnValue({ date: 1, additional: 0n });
	redis.xadd.mockResolvedValue('1-0'); redis.get.mockResolvedValue('1-0');
	const service = new NotificationService(config, redis, users, serializer, ids, events, push, cache, lists, webhooks);
	const create = async (type: MiNotification['type'], notifierId: string | null = 'author') => {
		service.createNotification('recipient', type, { noteId: 'note', reaction: '👍' } as never, notifierId);
		await Promise.all(pending.promises);
	};
	return { service, create, redis, serializer, events, cache, webhooks };
}

it.each(['mention', 'reply', 'reaction'] as const)('suppresses %s for never, mute, relationship filters and self', async type => {
	for (const filter of ['never', 'mute', 'following', 'follower', 'mutualFollow', 'followingOrFollower', 'self']) {
		const f = fixture();
		if (filter === 'mute') f.cache.userMutingsCache.fetch.mockResolvedValue(new Set(['author']));
		else if (filter !== 'self') f.cache.userProfileCache.fetch.mockResolvedValue({ notificationRecieveConfig: { [type]: { type: filter } } } as never);
		await f.create(type, filter === 'self' ? 'recipient' : 'author');
		expect(f.redis.xadd).not.toHaveBeenCalled(); expect(f.serializer.pack).not.toHaveBeenCalled(); expect(f.webhooks.enqueueUserWebhook).not.toHaveBeenCalled();
		f.service.dispose();
	}
});

it('does not emit when packing returns null', async () => {
	const f = fixture(); f.serializer.pack.mockResolvedValue(null); await f.create('mention');
	expect(f.redis.xadd).toHaveBeenCalledOnce(); expect(f.webhooks.enqueueUserWebhook).not.toHaveBeenCalled(); f.service.dispose();
});

it.each(['mention', 'reply', 'renote', 'follow', 'reaction'] as const)('preserves the legacy %s payload and enqueues before unread delay', async type => {
	const f = fixture();
	const packed = { id: 'notification', createdAt, type, note, user, userId: user.id, reaction: '👍' } as Packed<'Notification'>;
	f.serializer.pack.mockResolvedValue(packed);
	f.webhooks.enqueueUserWebhook.mockImplementation(async () => { expect(pending.delay).not.toHaveBeenCalled(); return []; });
	await f.create(type);
	const payload = type === 'follow' ? { user } : type === 'reaction' ? { note, user, reaction: '👍' } : { note };
	expect(f.webhooks.enqueueUserWebhook).toHaveBeenCalledWith('recipient', type === 'follow' ? 'followed' : type, payload, packed);
	expect(pending.delay).toHaveBeenCalledWith(2000, expect.any(String), expect.any(Object)); f.service.dispose();
});

it.each(['note', 'quote', 'login', 'createToken'] as const)('delivers packed %s notifications with the mapped flat name', async type => {
	const f = fixture(); const packed = { id: 'notification', createdAt, type, ...(type === 'note' || type === 'quote' ? { note, user, userId: user.id } : {}) } as Packed<'Notification'>;
	f.serializer.pack.mockResolvedValue(packed); await f.create(type, null);
	expect(f.webhooks.enqueueUserWebhook).toHaveBeenCalledWith('recipient', type === 'note' ? 'subscribedNote' : type, { notification: packed }, packed); f.service.dispose();
});

it.each(['login', 'createToken'] as const)('packs %s without IP, UA or token secrets even if stored input has extra fields', async type => {
	type Args = ConstructorParameters<typeof NotificationEntityService>;
	const serializer = new NotificationEntityService(mockDeep<Args[0]>(), mockDeep<Args[1]>(), mockDeep<Args[2]>(), mockDeep<Args[3]>(), mockDeep<Args[4]>());
	const packed = await serializer.pack({ id: 'notification', createdAt, type, ip: '192.0.2.1', userAgent: 'PRIVATE-UA', token: 'PRIVATE-TOKEN', accessToken: 'SECRET' } as MiNotification, 'recipient', { checkValidNotifier: false });
	expect(packed).toEqual({ id: 'notification', createdAt, type });
});

it('covers every non-grouped notification trigger exactly once in the shared list', () => {
	expect(new Set(webhookEventTypes).size).toBe(webhookEventTypes.length);
	for (const type of notificationTypes) expect(webhookEventTypes).toContain(notificationEventName(type));
	expect(webhookEventTypes).not.toContain('reaction:grouped'); expect(webhookEventTypes).not.toContain('renote:grouped');
});
