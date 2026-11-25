/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { afterEach, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { allSettled } from '@features/runtime/backend/async/promise-tracker.js';
import { NotificationService } from '../../backend/services/NotificationService.js';
import type { MiUser } from '@features/users/backend/models/User.js';

const timers = vi.hoisted(() => ({ pending: [] as Array<{
	finish(): void;
	completion: Promise<{ rejected: false } | { rejected: true; error: unknown }>;
}>, scheduled: undefined as (() => void) | undefined }));

const trackerObservations = vi.hoisted(() => ({ completions: [] as Array<Promise<
	{ rejected: false } | { rejected: true; error: unknown }
>> }));

vi.mock('@features/runtime/backend/async/promise-tracker.js', async importOriginal => {
	const actual = await importOriginal<typeof import('@features/runtime/backend/async/promise-tracker.js')>();
	return {
		...actual,
		trackPromise: (promise: Promise<unknown>) => {
			const originalFinally = promise.finally.bind(promise);
			// The real test tracker ignores its finally-derived promise. Observe that
			// derivative in the harness only; preserve the tracker and callback error.
			vi.spyOn(promise, 'finally').mockImplementation(onFinally => {
				const derivative = originalFinally(onFinally);
				trackerObservations.completions.push(derivative.then(
					() => ({ rejected: false as const }),
					error => ({ rejected: true as const, error }),
				));
				return derivative;
			});
			actual.trackPromise(promise);
		},
	};
});

vi.mock('node:timers/promises', () => ({
	setTimeout: (_delay: number, value: string, options: { signal: AbortSignal }) => {
		let resolve!: (value: string) => void;
		let reject!: (reason: unknown) => void;
		let fired = false;
		const timer = new Promise<string>((yes, no) => { resolve = yes; reject = no; });
		const originalThen = timer.then.bind(timer);
		let completed!: (outcome: { rejected: false } | { rejected: true; error: unknown }) => void;
		const completion = new Promise<{ rejected: false } | { rejected: true; error: unknown }>(yes => { completed = yes; });
		// Observe the actual continuation without changing its rejection or registering it
		// in the production tracker. The test owns this observation, preventing leaks.
		vi.spyOn(timer, 'then').mockImplementation((onFulfilled, onRejected) => {
			const continuation = originalThen(onFulfilled, onRejected);
			void continuation.then(() => { completed({ rejected: false }); }, error => { completed({ rejected: true, error }); });
			return continuation;
		});
		const abort = () => { if (!fired) reject(new DOMException('Aborted', 'AbortError')); };
		options.signal.addEventListener('abort', abort, { once: true });
		timers.pending.push({ finish: () => { fired = true; resolve(value); }, completion });
		timers.scheduled?.();
		return timer;
	},
}));

// Keep the actual NotificationService implementation; avoid bootstrapping its
// collaborators' transitive server graph or any database infrastructure.
vi.mock('@features/integrations/backend/services/UserWebhookService.js', () => ({ UserWebhookService: class {} }));
vi.mock('@features/runtime/backend/services/GlobalEventService.js', () => ({ GlobalEventService: class {} }));
vi.mock('../../backend/services/PushNotificationService.js', () => ({ PushNotificationService: class {} }));
vi.mock('../../backend/serializers/NotificationEntityService.js', () => ({ NotificationEntityService: class {} }));
vi.mock('@features/runtime/backend/services/IdService.js', () => ({ IdService: class {} }));
vi.mock('@features/users/backend/services/CacheService.js', () => ({ CacheService: class {} }));
vi.mock('@features/relationships/backend/services/UserListService.js', () => ({ UserListService: class {} }));

afterEach(() => {
	timers.pending.length = 0;
	timers.scheduled = undefined;
	trackerObservations.completions.length = 0;
	vi.unstubAllEnvs();
});

function fixture() {
	vi.stubEnv('NODE_ENV', 'test');
	type Args = ConstructorParameters<typeof NotificationService>;
	const config = mockDeep<Args[0]>({ perUserNotificationsMaxCount: 100 });
	const redis = mockDeep<Args[1]>();
	const users = mockDeep<Args[2]>();
	const serializer = mockDeep<Args[3]>();
	const ids = mockDeep<Args[4]>();
	const events = mockDeep<Args[5]>();
	const push = mockDeep<Args[6]>();
	const cache = mockDeep<Args[7]>();
	const lists = mockDeep<Args[8]>();
	const webhooks = mockDeep<Args[9]>();
	cache.userProfileCache.fetch.mockResolvedValue(mockDeep<Awaited<ReturnType<typeof cache.userProfileCache.fetch>>>({ notificationRecieveConfig: {} }));
	cache.userMutingsCache.fetch.mockResolvedValue(new Set());
	ids.gen.mockReturnValue('synthetic-notification');
	ids.parseFull.mockReturnValue({ date: 1800000000000, additional: 0n });
	redis.xadd.mockResolvedValue('1800000000000-0');
	redis.get.mockResolvedValue(null);
	serializer.pack.mockResolvedValue(mockDeep<NonNullable<Awaited<ReturnType<typeof serializer.pack>>>>({ id: 'synthetic-notification', type: 'follow' }));
	return { users, events, service: new NotificationService(config, redis, users, serializer, ids, events, push, cache, lists, webhooks) };
}

async function schedule(h: ReturnType<typeof fixture>) {
	const scheduled = new Promise<void>(resolve => { timers.scheduled = resolve; });
	expect(h.service.createNotification('synthetic-recipient', 'follow', {}, 'synthetic-follower')).toBeUndefined();
	await scheduled;
	expect(timers.pending).toHaveLength(1);
	expect(h.events.publishMainStream).toHaveBeenCalledWith('synthetic-recipient', 'notification', expect.objectContaining({ id: 'synthetic-notification' }));
	expect(h.users.findOneByOrFail).not.toHaveBeenCalled();
	return timers.pending[0];
}

test('shutdown tracker waits for the already-started delayed notification query', async () => {
	const h = fixture();
	let finishQuery!: (user: MiUser) => void;
	let entered!: () => void;
	const queryEntered = new Promise<void>(resolve => { entered = resolve; });
	const query = new Promise<MiUser>(resolve => { finishQuery = resolve; });
	h.users.findOneByOrFail.mockImplementation(() => { entered(); return query; });
	const timer = await schedule(h);
	timer.finish();
	await queryEntered;
	h.service.dispose();
	let drained = false;
	const draining = allSettled().then(() => { drained = true; });
	try {
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(h.users.findOneByOrFail).toHaveBeenCalledWith({ id: 'synthetic-follower' });
		expect(drained, 'owned delayed query must finish before shutdown drain resolves').toBe(false);
	} finally {
		finishQuery(mockDeep<MiUser>({ id: 'synthetic-follower' }));
		await timer.completion;
		await draining;
		expect(drained).toBe(true);
		expect(await trackerObservations.completions[0]).toEqual({ rejected: false });
	}
});

test('aborting before the timer fires does not start the delayed query', async () => {
	const h = fixture();
	const timer = await schedule(h);
	h.service.dispose();
	expect(await timer.completion).toEqual({ rejected: false });
	await allSettled();
	expect(await trackerObservations.completions[0]).toEqual({ rejected: false });
	expect(h.users.findOneByOrFail).not.toHaveBeenCalled();
});

test('observer reports the actual callback rejection instead of swallowing it', async () => {
	const h = fixture();
	const failure = new Error('synthetic deferred query disconnect');
	h.users.findOneByOrFail.mockRejectedValue(failure);
	const timer = await schedule(h);
	try {
		timer.finish();
		expect(await timer.completion).toEqual({ rejected: true, error: failure });
		await allSettled();
		expect(await trackerObservations.completions[0]).toEqual({ rejected: true, error: failure });
		expect(h.users.findOneByOrFail).toHaveBeenCalledOnce();
	} finally {
		h.service.dispose();
	}
});

test('reads an exact notification only from the recipient timeline and verifies the full id', async () => {
	const notification = { id: 'notification', type: 'login' };
	const xrange = vi.fn(async (key: string) => key === 'notificationTimeline:recipient' ? [['1000-2', ['data', JSON.stringify(notification)]]] : []);
	const parseFull = vi.fn(() => ({ date: 1000, additional: 2n }));
	const service = Object.assign(Object.create(NotificationService.prototype), { redisClient: { xrange }, idService: { parseFull } }) as NotificationService;
	expect(await service.getNotification('recipient', 'notification')).toEqual(notification);
	expect(xrange).toHaveBeenCalledWith('notificationTimeline:recipient', '1000-2', '1000-2');
	expect(await service.getNotification('other', 'notification')).toBeNull();
	// Redis sequence truncation must not authorize a different full notification id.
	expect(await service.getNotification('recipient', 'different-id')).toBeNull();
	parseFull.mockImplementation(() => { throw new Error('invalid id'); });
	xrange.mockClear();
	expect(await service.getNotification('recipient', 'invalid')).toBeNull();
	expect(xrange).not.toHaveBeenCalled();
});
