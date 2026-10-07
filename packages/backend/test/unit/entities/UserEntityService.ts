/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, beforeAll, afterAll, test } from 'vitest';
import { GlobalModule } from '@features/boot/backend/assembly/GlobalModule.js';
import { CoreModule } from '@features/boot/backend/assembly/CoreModule.js';
import { featureServiceGroups } from '@/core/feature-service-providers.js';
import { secureRndstr } from '@features/auth/backend/utility/secure-rndstr.js';
import { genAidx } from '@features/runtime/backend/id/aidx.js';
import {
	BlockingsRepository,
	FollowingsRepository, FollowRequestsRepository,
	type ModerationLogsRepository, MiUserProfile, MutingsRepository, RenoteMutingsRepository,
	UserMemoRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@features/persistence/backend/repositories/models.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UsersChart } from '@features/statistics/backend/charts/users.js';
import { InstanceChart } from '@features/statistics/backend/charts/instance.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { AvatarDecorationService } from '@features/avatar-decorations/backend/services/AvatarDecorationService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { FederatedInstanceService } from '@features/federation/backend/services/FederatedInstanceService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { FetchInstanceMetadataService } from '@features/federation/backend/services/FetchInstanceMetadataService.js';
import { ApResolverService } from '@features/federation/backend/services/ApResolverService.js';
import { ApNoteService } from '@features/federation/backend/services/ApNoteService.js';
import { ApImageService } from '@features/federation/backend/services/ApImageService.js';
import { ApMfmService } from '@features/federation/backend/services/ApMfmService.js';
import { MfmService } from '@features/markup/backend/services/MfmService.js';
import { HashtagService } from '@features/discovery/backend/services/HashtagService.js';
import { ChartLoggerService } from '@features/statistics/backend/services/ChartLoggerService.js';
import { ApLoggerService } from '@features/federation/backend/services/ApLoggerService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { ReactionService } from '@features/notes/backend/services/ReactionService.js';
import { NotificationService } from '@features/notifications/backend/services/NotificationService.js';
import { ReactionsBufferingService } from '@features/notes/backend/services/ReactionsBufferingService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import type { MiUser } from '@features/users/backend/models/User.js';

process.env.NODE_ENV = 'test';

describe('UserEntityService', () => {
	describe('pack/packMany', () => {
		let app: TestingModule;
		let service: UserEntityService;
		let usersRepository: UsersRepository;
		let userProfileRepository: UserProfilesRepository;
		let userMemosRepository: UserMemoRepository;
		let followingRepository: FollowingsRepository;
		let followingRequestRepository: FollowRequestsRepository;
		let blockingRepository: BlockingsRepository;
		let mutingRepository: MutingsRepository;
		let renoteMutingsRepository: RenoteMutingsRepository;

		async function createUser(userData: Partial<MiUser> = {}, profileData: Partial<MiUserProfile> = {}) {
			const un = secureRndstr(16);
			const user = await usersRepository
				.insert({
					...userData,
					id: genAidx(Date.now()),
					username: un,
					usernameLower: un.toLowerCase(),
				})
				.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

			await userProfileRepository.insert({
				...profileData,
				userId: user.id,
			});

			return user;
		}

		async function memo(writer: MiUser, target: MiUser, memo: string) {
			await userMemosRepository.insert({
				id: genAidx(Date.now()),
				userId: writer.id,
				targetUserId: target.id,
				memo,
			});
		}

		async function follow(follower: MiUser, followee: MiUser) {
			await followingRepository.insert({
				id: genAidx(Date.now()),
				followerId: follower.id,
				followeeId: followee.id,
			});
		}

		async function requestFollow(requester: MiUser, requestee: MiUser) {
			await followingRequestRepository.insert({
				id: genAidx(Date.now()),
				followerId: requester.id,
				followeeId: requestee.id,
			});
		}

		async function block(blocker: MiUser, blockee: MiUser) {
			await blockingRepository.insert({
				id: genAidx(Date.now()),
				blockerId: blocker.id,
				blockeeId: blockee.id,
			});
		}

		async function mute(mutant: MiUser, mutee: MiUser) {
			await mutingRepository.insert({
				id: genAidx(Date.now()),
				muterId: mutant.id,
				muteeId: mutee.id,
			});
		}

		async function muteRenote(mutant: MiUser, mutee: MiUser) {
			await renoteMutingsRepository.insert({
				id: genAidx(Date.now()),
				muterId: mutant.id,
				muteeId: mutee.id,
			});
		}

		function randomIntRange(weight = 10) {
			return [...Array(Math.floor(Math.random() * weight))].map((it, idx) => idx);
		}

		beforeAll(async () => {
			const services = [
				UserEntityService,
				ApPersonService,
				NoteEntityService,
				CustomEmojiService,
				RoleService,
				FederatedInstanceService,
				IdService,
				AvatarDecorationService,
				UtilityService,
				ModerationLogService,
				GlobalEventService,
				DriveFileEntityService,
				MetaService,
				FetchInstanceMetadataService,
				CacheService,
				ApResolverService,
				ApNoteService,
				ApImageService,
				ApMfmService,
				MfmService,
				HashtagService,
				UsersChart,
				ChartLoggerService,
				InstanceChart,
				ApLoggerService,
				AccountMoveService,
				ReactionService,
				ReactionsBufferingService,
				NotificationService,
				ChatService,
			];

			app = await Test.createTestingModule({
				imports: [GlobalModule, CoreModule],
				providers: [
					...services.filter(service => service !== ModerationLogService && service !== MfmService && service !== HashtagService),
					{
						provide: ModerationLogService,
						inject: [DI.moderationLogsRepository, IdService],
						useFactory: (repository: ModerationLogsRepository, id: IdService) => new ModerationLogService(repository, id),
					},
					{
						provide: MfmService,
						inject: [DI.config],
						useFactory: (config: Config) => new MfmService(config),
					},
					...featureServiceGroups.ranking.providers,
					...featureServiceGroups.announcements.providers,
					...featureServiceGroups.pages.providers,
					...featureServiceGroups.emojis.providers,
					...services.map(x => ({ provide: x.name, useExisting: x })),
				],
			}).compile();
			await app.init();
			app.enableShutdownHooks();

			service = app.get<UserEntityService>(UserEntityService);
			usersRepository = app.get<UsersRepository>(DI.usersRepository);
			userProfileRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
			userMemosRepository = app.get<UserMemoRepository>(DI.userMemosRepository);
			followingRepository = app.get<FollowingsRepository>(DI.followingsRepository);
			followingRequestRepository = app.get<FollowRequestsRepository>(DI.followRequestsRepository);
			blockingRepository = app.get<BlockingsRepository>(DI.blockingsRepository);
			mutingRepository = app.get<MutingsRepository>(DI.mutingsRepository);
			renoteMutingsRepository = app.get<RenoteMutingsRepository>(DI.renoteMutingsRepository);
		});

		afterAll(async () => {
			await app.close();
		});

		test('UserLite', async() => {
			const me = await createUser();
			const who = await createUser();

			await memo(me, who, 'memo');

			const actual = await service.pack(who, me, { schema: 'UserLite' }) as any;
			// no detail
			expect(actual.memo).toBeUndefined();
			// no detail and me
			expect(actual.birthday).toBeUndefined();
			// no detail and me
			expect(actual.achievements).toBeUndefined();
		});

		test('UserDetailedNotMe', async() => {
			const me = await createUser();
			const who = await createUser({}, { birthday: '2000-01-01' });

			await memo(me, who, 'memo');

			const actual = await service.pack(who, me, { schema: 'UserDetailedNotMe' }) as any;
			// is detail
			expect(actual.memo).toBe('memo');
			// is detail
			expect(actual.birthday).toBe('2000-01-01');
			// no detail and me
			expect(actual.achievements).toBeUndefined();
		});

		test('MeDetailed', async() => {
			const achievements = [{ name: 'iLoveMisskey' as const, unlockedAt: new Date().getTime() }];
			const me = await createUser({}, {
				birthday: '2000-01-01',
				achievements: achievements,
			});
			await memo(me, me, 'memo');

			const actual = await service.pack(me, me, { schema: 'MeDetailed' }) as any;
			// is detail
			expect(actual.memo).toBe('memo');
			// is detail
			expect(actual.birthday).toBe('2000-01-01');
			// is detail and me
			expect(actual.achievements).toEqual(achievements);
		});

		test('alsoKnownAs as string does not throw', async () => {
			const me = await createUser();
			const who = await createUser();

			const whoWithStringAlsoKnownAs: MiUser = { ...who, alsoKnownAs: 'https://remote.example.com/users/alice' as any };

			const actual = await service.pack(whoWithStringAlsoKnownAs, me, { schema: 'UserDetailedNotMe' }) as any;
			expect(Array.isArray(actual.alsoKnownAs)).toBe(true);
		});

		describe('packManyによるpreloadがある時、preloadが無い時とpackの結果が同じになるか見たい', () => {
			test('no-preload', async() => {
				const me = await createUser();
				// meがフォローしてる人たち
				const followeeMe = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of followeeMe) {
					await follow(me, who);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(true);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meをフォローしてる人たち
				const followerMe = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of followerMe) {
					await follow(who, me);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(true);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meがフォローリクエストを送った人たち
				const requestsFromYou = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of requestsFromYou) {
					await requestFollow(me, who);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(true);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meにフォローリクエストを送った人たち
				const requestsToYou = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of requestsToYou) {
					await requestFollow(who, me);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(true);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meがブロックしてる人たち
				const blockingYou = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of blockingYou) {
					await block(me, who);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(true);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meをブロックしてる人たち
				const blockingMe = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of blockingMe) {
					await block(who, me);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(true);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meがミュートしてる人たち
				const muters = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of muters) {
					await mute(me, who);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(true);
					expect(actual.isRenoteMuted).toBe(false);
				}

				// meがリノートミュートしてる人たち
				const renoteMuters = await Promise.all(randomIntRange().map(() => createUser()));
				for (const who of renoteMuters) {
					await muteRenote(me, who);
					const actual = await service.pack(who, me, { schema: 'UserDetailed' }) as any;
					expect(actual.isFollowing).toBe(false);
					expect(actual.isFollowed).toBe(false);
					expect(actual.hasPendingFollowRequestFromYou).toBe(false);
					expect(actual.hasPendingFollowRequestToYou).toBe(false);
					expect(actual.isBlocking).toBe(false);
					expect(actual.isBlocked).toBe(false);
					expect(actual.isMuted).toBe(false);
					expect(actual.isRenoteMuted).toBe(true);
				}
			});

			test('preload', async() => {
				const me = await createUser();

				{
					// meがフォローしてる人たち
					const followeeMe = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of followeeMe) {
						await follow(me, who);
					}
					const actualList = await service.packMany(followeeMe, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(true);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meをフォローしてる人たち
					const followerMe = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of followerMe) {
						await follow(who, me);
					}
					const actualList = await service.packMany(followerMe, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(true);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meがフォローリクエストを送った人たち
					const requestsFromYou = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of requestsFromYou) {
						await requestFollow(me, who);
					}
					const actualList = await service.packMany(requestsFromYou, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(true);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meにフォローリクエストを送った人たち
					const requestsToYou = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of requestsToYou) {
						await requestFollow(who, me);
					}
					const actualList = await service.packMany(requestsToYou, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(true);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meがブロックしてる人たち
					const blockingYou = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of blockingYou) {
						await block(me, who);
					}
					const actualList = await service.packMany(blockingYou, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(true);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meをブロックしてる人たち
					const blockingMe = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of blockingMe) {
						await block(who, me);
					}
					const actualList = await service.packMany(blockingMe, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(true);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meがミュートしてる人たち
					const muters = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of muters) {
						await mute(me, who);
					}
					const actualList = await service.packMany(muters, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(true);
						expect(actual.isRenoteMuted).toBe(false);
					}
				}

				{
					// meがリノートミュートしてる人たち
					const renoteMuters = await Promise.all(randomIntRange().map(() => createUser()));
					for (const who of renoteMuters) {
						await muteRenote(me, who);
					}
					const actualList = await service.packMany(renoteMuters, me, { schema: 'UserDetailed' }) as any;
					for (const actual of actualList) {
						expect(actual.isFollowing).toBe(false);
						expect(actual.isFollowed).toBe(false);
						expect(actual.hasPendingFollowRequestFromYou).toBe(false);
						expect(actual.hasPendingFollowRequestToYou).toBe(false);
						expect(actual.isBlocking).toBe(false);
						expect(actual.isBlocked).toBe(false);
						expect(actual.isMuted).toBe(false);
						expect(actual.isRenoteMuted).toBe(true);
					}
				}
			});
		});
	});
});
