/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { entities } from '@features/persistence/backend/postgres.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { MiFollowing } from '@features/relationships/backend/models/Following.js';
import { MiUserProfile } from '@features/users/backend/models/UserProfile.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import type { MiUser } from '@features/users/backend/models/User.js';
import { ActivityPubServerService } from '@features/federation/backend/http/ActivityPubServerService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { MiNote } from '@features/notes/backend/models/Note.js';

// These predicates are constructor fields; no injected services are used by them.
const userEntityPredicates = Reflect.construct(UserEntityService, []) as UserEntityService;

function instance<T extends object>(prototype: T, dependencies: Record<string, unknown>): T {
	const value = Object.create(prototype);
	for (const [key, dependency] of Object.entries(dependencies)) {
		Object.defineProperty(value, key, { value: dependency, configurable: true });
	}
	return value;
}

test('following cache excludes inactive rows and invalidates both suspension transitions', async () => {
	let suspended = false;
	const stored = new Map([['kvcache:userFollowings:viewer', JSON.stringify({ stale: { withReplies: false } })]]);
	const redis = {
		get: vi.fn(async (key: string) => stored.get(key) ?? null),
		set: vi.fn(async (key: string, value: string) => { stored.set(key, value); return 'OK'; }),
		del: vi.fn(async (key: string) => Number(stored.delete(key))),
	};
	const subscriber = { on: vi.fn(), off: vi.fn() };
	const users = { findOneBy: vi.fn(async () => ({ id: 'viewer', host: 'remote.example', isSuspended: suspended })) };
	const following = { find: vi.fn(async ({ where }: { where: { isFollowerSuspended?: boolean } }) =>
		where.isFollowerSuspended === false && suspended ? [] : [{ followeeId: 'author', withReplies: true }]) };
	const dependencies = [redis, subscriber, users, {}, {}, {}, {}, following, { isLocalUser: () => false }] as unknown as ConstructorParameters<typeof CacheService>;
	const service = new CacheService(...dependencies);
	try {
		expect(await service.userFollowingsCache.fetch('viewer')).toEqual({ author: { withReplies: true } });
		for (const state of [true, false]) {
			suspended = state;
			await Reflect.get(service, 'onMessage')('internal', JSON.stringify({
				channel: 'internal', message: { type: 'userChangeSuspendedState', body: { id: 'viewer', isSuspended: state } },
			}));
			expect(await service.userFollowingsCache.fetch('viewer')).toEqual(state ? {} : { author: { withReplies: true } });
		}
		expect(following.find).toHaveBeenLastCalledWith({
			where: { followerId: 'viewer', isFollowerSuspended: false }, select: { followeeId: true, withReplies: true },
		});
		expect(redis.del).toHaveBeenCalledWith('kvcache:activeUserFollowings:viewer');
		suspended = true;
		redis.del.mockRejectedValueOnce(new Error('Redis unavailable'));
		await expect(Reflect.get(service, 'onMessage')('internal', JSON.stringify({
			channel: 'internal', message: { type: 'userChangeSuspendedState', body: { id: 'viewer', isSuspended: true } },
		}))).rejects.toThrow('Redis unavailable');
		expect(service.userByIdCache.get('viewer')?.isSuspended).toBe(true);
	} finally {
		service.dispose();
	}
});

for (const method of ['followers', 'following'] as const) {
	for (const page of [false, true]) {
		test(`AP ${method} ${page ? 'page' : 'index'} uses active rows and a matching total`, async () => {
			const relationKey = method === 'followers' ? 'followeeId' : 'followerId';
			const following = {
				countBy: vi.fn(async (where: { isFollowerSuspended?: boolean }) => where.isFollowerSuspended === false ? 1 : 2),
				find: vi.fn(async ({ where }: { where: { isFollowerSuspended?: boolean } }) => {
					const row = { id: '1', followerId: method === 'followers' ? 'active' : 'owner', followeeId: method === 'following' ? 'active' : 'owner' };
					return where.isFollowerSuspended === false ? [row] : [row, { ...row, id: '2' }];
				}),
			};
			const service = instance(ActivityPubServerService.prototype, {
				meta: { federation: 'all' }, config: { url: 'https://example.test' },
				usersRepository: { findOneBy: async () => ({ id: 'owner', followersCount: 999, followingCount: 999 }) },
				userProfilesRepository: { findOneByOrFail: async () => ({ followersVisibility: 'public', followingVisibility: 'public' }) },
				followingsRepository: following,
				apRendererService: {
					renderFollowUser: async (id: string) => id,
					renderOrderedCollection: (id: string, totalItems: number) => ({ id, totalItems }),
					renderOrderedCollectionPage: (id: string, totalItems: number, orderedItems: string[]) => ({ id, totalItems, orderedItems }),
					addContext: (value: unknown) => value,
				},
				setResponseType: vi.fn(),
			});
			const reply = { code: vi.fn(), header: vi.fn() };
			const result = await Reflect.get(service, method)({ params: { user: 'owner' }, query: { page: String(page), cursor: 'cursor' } }, reply);
			expect(result.totalItems).toBe(1);
			expect(following.countBy).toHaveBeenCalledWith({ [relationKey]: 'owner', isFollowerSuspended: false });
			if (page) {
				expect(result.orderedItems).toEqual(['active']);
				expect(following.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ [relationKey]: 'owner', isFollowerSuspended: false }) }));
			} else {
				expect(following.find).not.toHaveBeenCalled();
			}
		});
	}
}

test('direct local follower-only note visibility rejects an inactive edge and restores on activation', async () => {
	let suspended = true;
	const count = vi.fn(async ({ where }: { where: { isFollowerSuspended?: boolean } }) => suspended && where.isFollowerSuspended === false ? 0 : 1);
	const service = instance(NoteEntityService.prototype, {
		followingsRepository: { count }, usersRepository: { findOneByOrFail: async () => ({ id: 'viewer', host: null }) },
	});
	const note = { userId: 'author', userHost: null, visibility: 'followers', mentions: [], replyUserId: null } as unknown as MiNote;
	expect(await service.isVisibleForMe(note, 'viewer')).toBe(false);
	suspended = false;
	expect(await service.isVisibleForMe(note, 'viewer')).toBe(true);
	expect(count).toHaveBeenCalledWith({ where: { followeeId: 'author', followerId: 'viewer', isFollowerSuspended: false }, take: 1 });
});

test('single and bulk relation packing ignore inactive edges', async () => {
	let suspended = true;
	const active = { followeeId: 'target', withReplies: true };
	const emptyQuery = () => {
		const query = { select: () => query, where: () => query, getRawMany: async () => [] };
		return query;
	};
	const following = {
		findOneBy: async (where: { isFollowerSuspended?: boolean }) => suspended && where.isFollowerSuspended === false ? null : active,
		exists: async ({ where }: { where: { isFollowerSuspended?: boolean } }) => !(suspended && where.isFollowerSuspended === false),
		findBy: async (where: { isFollowerSuspended?: boolean }) => suspended && where.isFollowerSuspended === false ? [] : [active],
		createQueryBuilder: () => {
			let filtered = false;
			const query = {
				select: () => query, where: () => query,
				andWhere: (condition: string) => { filtered = condition === 'f.isFollowerSuspended = false'; return query; },
				getRawMany: async () => suspended && filtered ? [] : [{ f_followerId: 'target' }],
			};
			return query;
		},
	};
	const unrelated = { exists: async () => false, createQueryBuilder: emptyQuery };
	const service = instance(UserEntityService.prototype, {
		followingsRepository: following, followRequestsRepository: unrelated, blockingsRepository: unrelated,
		mutingsRepository: unrelated, renoteMutingsRepository: unrelated,
	});
	for (const state of [true, false]) {
		suspended = state;
		expect(await service.getRelation('viewer', 'target')).toMatchObject({ isFollowing: !state, isFollowed: !state });
		expect((await service.getRelations('viewer', ['target'])).get('target')).toMatchObject({ isFollowing: !state, isFollowed: !state });
	}
});

test('generated note and relationship visibility SQL uses active following subqueries', async () => {
	const source = new DataSource({ type: 'postgres', entities: [...entities] });
	// Build metadata only: no connection, schema write, or server is needed to inspect generated SQL.
	await Reflect.get(source, 'buildMetadatas').call(source);
	const service = instance(QueryService.prototype, {
		followingsRepository: source.getRepository(MiFollowing),
		userProfilesRepository: source.getRepository(MiUserProfile),
	});
	const notes = source.getRepository(MiNote).createQueryBuilder('note');
	service.generateVisibilityQuery(notes, { id: 'viewer' });
	expect(notes.getSql()).toContain('"following"."isFollowerSuspended" = false');
	expect(notes.getParameters().meId).toBe('viewer');
	for (const list of ['followers', 'following'] as const) {
		const relations = source.getRepository(MiFollowing).createQueryBuilder('relation');
		service.generateFollowingRelationVisibilityQuery(relations, list, { id: 'viewer' });
		expect(relations.getSql()).toContain('"meFollowing"."isFollowerSuspended" = false');
		expect(relations.getParameters().meId).toBe('viewer');
	}
});

test('account move does not schedule new follows for inactive local followers', async () => {
	const createFollowJob = vi.fn();
	const findBy = vi.fn(async (where: { isFollowerSuspended?: boolean }) => where.isFollowerSuspended === false ? [] : [{ followerId: 'suspended' }]);
	const noop = async () => undefined;
	const service = instance(AccountMoveService.prototype, {
		copyBlocking: noop, copyMutings: noop, copyRoles: noop, updateLists: noop, adjustFollowingCounts: noop,
		antennaService: { onMoveAccount: noop }, systemAccountService: { fetch: async () => ({ id: 'proxy' }) },
		followingsRepository: { findBy }, queueService: { createFollowJob },
	});
	await service.postMoveProcess({ id: 'source' } as MiUser, { id: 'destination' } as MiUser);
	expect(findBy).toHaveBeenCalledWith(expect.objectContaining({ followeeId: 'source', isFollowerSuspended: false }));
	expect(createFollowJob).toHaveBeenCalledWith([]);
});

test.each([null, 'remote.example'])('queued follow checks current suspension before sending from %s', async host => {
	const createFollowRequest = vi.fn();
	const insertFollowingDoc = vi.fn();
	const service = instance(UserFollowingService.prototype, {
		usersRepository: { findOneByOrFail: async ({ id }: { id: string }) => id === 'actor'
			? { id, host, isSuspended: true }
			: { id, host: 'destination.example', isLocked: true } },
		userEntityService: userEntityPredicates,
		createFollowRequest, insertFollowingDoc,
	});
	await expect(service.follow({ id: 'actor' }, { id: 'target' })).resolves.toBeUndefined();
	expect(createFollowRequest).not.toHaveBeenCalled();
	expect(insertFollowingDoc).not.toHaveBeenCalled();
});

test('inactive reverse and moved-account relations cannot auto-approve a locked follow', async () => {
	const createFollowRequest = vi.fn(async () => undefined);
	const insertFollowingDoc = vi.fn(async () => undefined);
	const exists = vi.fn(async ({ where }: { where: { followerId: string; isFollowerSuspended?: boolean } }) =>
		where.followerId !== 'actor' && where.isFollowerSuspended !== false);
	const service = instance(UserFollowingService.prototype, {
		usersRepository: { findOneByOrFail: async ({ id }: { id: string }) => id === 'actor'
			? { id, host: 'remote.example', isSuspended: false }
			: { id, host: null, isLocked: true } },
		userEntityService: userEntityPredicates,
		userBlockingService: { checkBlocked: async () => false },
		userProfilesRepository: { findOneByOrFail: async () => ({ autoAcceptFollowed: true }) },
		idService: { parse: () => ({ date: Date.UTC(2020, 0, 1) }) },
		followingsRepository: { exists },
		accountMoveService: { validateAlsoKnownAs: async (_: unknown, predicate: (old: { id: string }, moved: { id: string }) => Promise<boolean>) => predicate({ id: 'old' }, { id: 'alias' }) },
		createFollowRequest, insertFollowingDoc, deliverAccept: vi.fn(),
	});
	await service.follow({ id: 'actor' }, { id: 'target' });
	expect(createFollowRequest).toHaveBeenCalledOnce();
	expect(insertFollowingDoc).not.toHaveBeenCalled();
	expect(exists).toHaveBeenCalledWith({ where: { followerId: 'target', followeeId: 'actor', isFollowerSuspended: false } });
	expect(exists).toHaveBeenCalledWith({ where: { followerId: 'alias', followeeId: 'target', isFollowerSuspended: false } });
});
