/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { In } from 'typeorm';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { UserSuspendService } from '../../../features/moderation/backend/services/UserSuspendService.js';
import { UserFollowingService } from '../../../features/relationships/backend/services/UserFollowingService.js';
import type { InstanceEntityService } from '../../../features/instance/backend/serializers/InstanceEntityService.js';
import type { FollowingsRepository, InstancesRepository, MiUser, UsersRepository } from '@/models/_.js';
import { EndpointImplementation as FederationStats } from '../../../features/federation/backend/endpoints/federation/stats.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { FollowingIsFollowerSuspended1791310067731 as SuspensionSchemaMigration } from '../../migration/1791310067731-FollowingIsFollowerSuspended.js';
import { FollowingIsFollowerSuspendedCopySuspendedState1791310067732 as SuspensionBackfillMigration } from '../../migration/1791310067732-FollowingIsFollowerSuspendedCopySuspendedState.js';

describe('suspension consistency', () => {
	let app: TestingModule;
	let users: UsersRepository;
	let followings: FollowingsRepository;
	let instances: InstancesRepository;
	let suspension: UserSuspendService;
	let following: UserFollowingService;
	const userIds: string[] = [];
	const instanceIds: string[] = [];

	beforeAll(async () => {
		app = await Test.createTestingModule({ imports: [GlobalModule], providers: [UserSuspendService] })
			.useMocker(() => mockDeep())
			.compile();
		users = app.get(DI.usersRepository);
		followings = app.get(DI.followingsRepository);
		instances = app.get(DI.instancesRepository);
		suspension = app.get(UserSuspendService);
		vi.spyOn(suspension as any, 'postSuspend').mockResolvedValue(undefined);
		vi.spyOn(suspension as any, 'postUnsuspend').mockResolvedValue(undefined);
		following = Object.assign(Object.create(UserFollowingService.prototype), {
			usersRepository: users,
			followingsRepository: followings,
			followRequestsRepository: app.get(DI.followRequestsRepository),
			idService: { gen: () => secureRndstr(16) },
			cacheService: { userFollowingsCache: { refresh: vi.fn() } },
			globalEventService: { publishInternalEvent: vi.fn() },
			userEntityService: {
				isRemoteUser: (user: MiUser) => user.host != null,
				isLocalUser: (user: MiUser) => user.host == null,
				isSuspendedEither: (user: MiUser) => user.isSuspended || ('isRemoteSuspended' in user && user.isRemoteSuspended === true),
			},
			meta: {},
			perUserFollowingChart: { update: vi.fn() },
		});
	});

	afterEach(async () => {
		await followings.delete([{ followerId: In(userIds) }, { followeeId: In(userIds) }]);
		await users.delete({ id: In(userIds.splice(0)) });
		await instances.delete({ id: In(instanceIds.splice(0)) });
	});
	afterAll(async () => { await app.close(); });

	async function user(host: string | null = `${secureRndstr(8)}.example.com`) {
		const id = secureRndstr(16);
		userIds.push(id);
		await users.insert({ id, username: id, usernameLower: id, host });
		return await users.findOneByOrFail({ id });
	}

	async function follow(follower: MiUser, followee: MiUser) {
		await following['insertFollowingDoc'](followee, follower, true);
	}

	test.each([true, false])('follow creation agrees with suspension in either order (follow first: %s)', async followFirst => {
		const actor = await user();
		const target = await user();
		if (followFirst) await follow(actor, target);
		await suspension.suspend(actor, actor);
		if (!followFirst) await follow(actor, target); // actor still has the old flag
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(true);
		await suspension.unsuspend(actor, actor);
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(false);
	});

	test('concurrent follow, suspend and unsuspend leave both tables consistent', async () => {
		const actor = await user();
		const target = await user();
		await Promise.all([follow(actor, target), suspension.suspend(actor, actor), suspension.unsuspend(actor, actor)]);
		const current = await users.findOneByOrFail({ id: actor.id });
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(current.isSuspended);
	});

	test('mutual following excludes either suspended direction and restores on unsuspend', async () => {
		const a = await user();
		const b = await user();
		await follow(a, b);
		await follow(b, a);
		expect(await following.isMutual(a.id, b.id)).toBe(true);
		for (const actor of [a, b]) {
			await suspension.suspend(actor, actor);
			expect(await following.isMutual(a.id, b.id)).toBe(false);
			await suspension.unsuspend(actor, actor);
		}
		expect(await following.isMutual(a.id, b.id)).toBe(true);
	});

	test('reciprocal follows can be inserted concurrently without a deadlock', async () => {
		const a = await user();
		const b = await user();
		await Promise.all([follow(a, b), follow(b, a)]);
		expect(await following.isMutual(a.id, b.id)).toBe(true);
	});

	test('statistics rank active relationships, not stale instance counters', async () => {
		const prefix = secureRndstr(8);
		const hosts = [`${prefix}-active.example.com`, `${prefix}-suspended.example.com`, `${prefix}-other.example.com`];
		for (const [index, host] of hosts.entries()) {
			const id = secureRndstr(16);
			instanceIds.push(id);
			await instances.insert({ id, host, firstRetrievedAt: new Date(), followersCount: index ? 100 : 0, followingCount: index ? 100 : 0 });
			const a = await user(host);
			const b = await user(null);
			for (const [follower, followee] of [[a, b], [b, a]]) {
				await followings.insert({ id: secureRndstr(16), followerId: follower.id, followeeId: followee.id, followerHost: follower.host, followeeHost: followee.host });
			}
			if (index === 0) {
				const c = await user(null);
				await followings.insert({ id: secureRndstr(16), followerId: c.id, followeeId: a.id, followerHost: null, followeeHost: a.host });
			}
			if (index === 1) {
				await suspension.suspend(a, a);
				await suspension.suspend(b, b);
			}
		}
		const packer = { packMany: async (values: unknown[]) => values } as unknown as InstanceEntityService;
		const endpoint = new FederationStats(instances, followings, packer);
		const result = await endpoint.exec({ limit: 1 }, null, null);
		expect(result.topSubInstances[0]).toMatchObject({ host: hosts[0], followersCount: 2 });
		expect(result.topPubInstances[0]).toMatchObject({ host: hosts[0], followingCount: 1 });
		expect(result.otherFollowersCount).toBe(1);
		expect(result.otherFollowingCount).toBe(1);
	});

	test('statistics handle no relationships', async () => {
		const packer = { packMany: async (values: unknown[]) => values } as unknown as InstanceEntityService;
		const endpoint = new FederationStats(instances, followings, packer);
		expect(await endpoint.exec({ limit: 1 }, null, null)).toEqual({
			topSubInstances: [], topPubInstances: [], otherFollowersCount: 0, otherFollowingCount: 0,
		});
	});
	test('suspension migrations preserve rows, backfill flags, and round-trip to a clean schema', async () => {
		const active = await user();
		const suspended = await user();
		const target = await user();
		await follow(active, target);
		await follow(suspended, target);
		await users.update(suspended.id, { isSuspended: true });
		const runner = users.manager.connection.createQueryRunner();
		await runner.connect();
		try {
			await runner.startTransaction();
			const schema = new SuspensionSchemaMigration();
			const backfill = new SuspensionBackfillMigration();
			await schema.down(runner);
			await schema.up(runner);
			await backfill.up(runner);
			const flags = await runner.query('SELECT "followerId", "isFollowerSuspended" FROM "following" WHERE "followeeId" = $1', [target.id]);
			expect(flags).toEqual(expect.arrayContaining([
				{ followerId: active.id, isFollowerSuspended: false },
				{ followerId: suspended.id, isFollowerSuspended: true },
			]));
			expect(flags).toHaveLength(2);
			await backfill.down(runner);
			await schema.down(runner);
			const columns = await runner.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'following' AND column_name = 'isFollowerSuspended'`);
			expect(columns).toHaveLength(0);
			await schema.up(runner);
			await backfill.up(runner);
			await runner.commitTransaction();
			const pending = await users.manager.connection.driver.createSchemaBuilder().log();
			expect(pending.upQueries).toEqual([]);
			expect(pending.downQueries).toEqual([]);
		} finally {
			if (runner.isTransactionActive) await runner.rollbackTransaction();
			await runner.release();
		}
	});
});
