/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@features/boot/backend/assembly/GlobalModule.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { AnnouncementService } from '@features/announcements/backend/services/AnnouncementService.js';
import { featureServiceGroups } from '@features/index/backend/feature-service-providers.js';
import type {
	AnnouncementReadsRepository,
	AnnouncementsRepository,
	MiAnnouncement,
	MiUser,
	UsersRepository,
} from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { genAidx } from '@features/runtime/backend/id/aidx.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { secureRndstr } from '@features/auth/backend/utility/secure-rndstr.js';
import type { TestingModule } from '@nestjs/testing';

describe('AnnouncementService', () => {
	let app: TestingModule;
	let announcementService: AnnouncementService;
	let queueService: Mocked<QueueService>;
	let usersRepository: UsersRepository;
	let announcementsRepository: AnnouncementsRepository;
	let announcementReadsRepository: AnnouncementReadsRepository;
	let globalEventService: Mocked<GlobalEventService>;
	let moderationLogService: Mocked<ModerationLogService>;

	function createUser(data: Partial<MiUser> = {}) {
		const un = secureRndstr(16);
		return usersRepository.insert({
			id: genAidx(Date.now()),
			username: un,
			usernameLower: un.toLowerCase(),
			...data,
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	function createAnnouncement(data: Partial<MiAnnouncement & { createdAt: Date }> = {}) {
		return announcementsRepository.insert({
			id: genAidx(data.createdAt?.getTime() ?? Date.now()),
			updatedAt: null,
			title: 'Title',
			text: 'Text',
			...data,
		})
			.then(x => announcementsRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				...featureServiceGroups.announcements.providers,
				CacheService,
				IdService,
			],
		})
			.useMocker((token) => {
				if (token === GlobalEventService) {
					return {
						publishMainStream: vi.fn(),
						publishBroadcastStream: vi.fn(),
					};
				} else if (token === ModerationLogService) {
					return {
						log: vi.fn(),
					};
				} else if (typeof token === 'function') {
					return mockDeep<typeof token>();
				}
			})
			.compile();

		app.enableShutdownHooks();

		announcementService = app.get<AnnouncementService>(AnnouncementService);
		queueService = app.get<QueueService>(QueueService) as Mocked<QueueService>;
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		announcementsRepository = app.get<AnnouncementsRepository>(DI.announcementsRepository);
		announcementReadsRepository = app.get<AnnouncementReadsRepository>(DI.announcementReadsRepository);
		globalEventService = app.get<GlobalEventService>(GlobalEventService) as Mocked<GlobalEventService>;
		moderationLogService = app.get<ModerationLogService>(ModerationLogService) as Mocked<ModerationLogService>;
	});

	afterEach(async () => {
		await Promise.all([
			app.get(DI.metasRepository).createQueryBuilder().delete().execute(),
			usersRepository.createQueryBuilder().delete().execute(),
			announcementsRepository.createQueryBuilder().delete().execute(),
			announcementReadsRepository.createQueryBuilder().delete().execute(),
		]);

		await app.close();
	});

	describe('getUnreadAnnouncements', () => {
		test('通常', async () => {
			const user = await createUser();
			const announcement = await createAnnouncement({
				title: '1',
			});

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(1);
			expect(result[0].title).toBe(announcement.title);
		});

		test('isActiveがfalseは除外', async () => {
			const user = await createUser();
			await createAnnouncement({
				isActive: false,
			});

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(0);
		});

		test('forExistingUsers', async () => {
			const user = await createUser();
			const [announcementAfter, announcementBefore, announcementBefore2] = await Promise.all([
				createAnnouncement({
					title: 'after',
					createdAt: new Date(),
					forExistingUsers: true,
				}),
				createAnnouncement({
					title: 'before',
					createdAt: new Date(Date.now() - 1000),
					forExistingUsers: true,
				}),
				createAnnouncement({
					title: 'before2',
					createdAt: new Date(Date.now() - 1000),
					forExistingUsers: false,
				}),
			]);

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(2);
			expect(result.some(a => a.title === announcementAfter.title)).toBe(true);
			expect(result.some(a => a.title === announcementBefore.title)).toBe(false);
			expect(result.some(a => a.title === announcementBefore2.title)).toBe(true);
		});
	});

	describe('create', () => {
		test('通常', async () => {
			const me = await createUser();
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
			}, me);

			expect(result.raw.title).toBe('Title');
			expect(result.packed.title).toBe('Title');

			expect(globalEventService.publishBroadcastStream).toHaveBeenCalled();
			expect(globalEventService.publishBroadcastStream.mock.lastCall![0]).toBe('announcementCreated');
			expect((globalEventService.publishBroadcastStream.mock.lastCall![1] as any).announcement).toBe(result.packed);
			expect(moderationLogService.log).toHaveBeenCalled();
		});

		test('ユーザー指定', async () => {
			const me = await createUser();
			const user = await createUser();
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
				userId: user.id,
			}, me);

			expect(result.raw.title).toBe('Title');
			expect(result.packed.title).toBe('Title');

			expect(globalEventService.publishBroadcastStream).not.toHaveBeenCalled();
			expect(globalEventService.publishMainStream).toHaveBeenCalled();
			expect(globalEventService.publishMainStream.mock.lastCall![0]).toBe(user.id);
			expect(globalEventService.publishMainStream.mock.lastCall![1]).toBe('announcementCreated');
			expect((globalEventService.publishMainStream.mock.lastCall![2] as any).announcement).toBe(result.packed);
			expect(moderationLogService.log).toHaveBeenCalled();
		});
	});

	describe('auto archive', () => {
		test('excludes expired deadlines but retains future and unset deadlines even before the job runs', async () => {
			const user = await createUser();
			const now = Date.now();
			await createAnnouncement({ autoArchiveAt: new Date(now - 1000) });
			const future = await createAnnouncement({ autoArchiveAt: new Date(now + 60000) });
			const indefinite = await createAnnouncement({ autoArchiveAt: null });
			const result = await announcementService.getUnreadAnnouncements(user);
			expect(result.map(row => row.id).sort()).toEqual([future.id, indefinite.id].sort());
		});

		test('archives only the expired current deadline and ignores early and stale jobs', async () => {
			const previousDeadline = new Date(Date.now() - 60000);
			const futureDeadline = new Date(Date.now() + 60000);
			const announcement = await createAnnouncement({ autoArchiveAt: futureDeadline });
			expect(await announcementService.archiveAnnouncement(announcement.id, futureDeadline)).toBe(false);
			const currentDeadline = new Date(Date.now() - 1000);
			await announcementService.update(announcement, { autoArchiveAt: currentDeadline });
			expect(await announcementService.archiveAnnouncement(announcement.id, previousDeadline)).toBe(false);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).isActive).toBe(true);
			expect(await announcementService.archiveAnnouncement(announcement.id, currentDeadline)).toBe(true);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).isActive).toBe(false);
			expect(await announcementService.archiveAnnouncement(announcement.id, currentDeadline)).toBe(false);
		});

		test('restores only active scheduled announcements on module initialization', async () => {
			const deadline = new Date(Date.now() + 60000);
			const active = await createAnnouncement({ autoArchiveAt: deadline });
			await createAnnouncement({ autoArchiveAt: deadline, isActive: false });
			await createAnnouncement({ autoArchiveAt: null });
			await announcementService.restoreScheduledArchives();
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledTimes(1);
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(active.id, deadline);
		});

		test('creation schedules its deadline and deletion cancels the same job', async () => {
			const deadline = new Date(Date.now() + 60000);
			const { raw } = await announcementService.create({ title: 'Scheduled', text: 'Body', autoArchiveAt: deadline });
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(raw.id, deadline);
			await announcementService.delete(raw);
			expect(queueService.clearAnnouncementArchive).toHaveBeenCalledWith(raw.id, deadline);
		});

		test('changing or clearing a deadline cancels the previous job and preserves omitted deadlines', async () => {
			const deadline = new Date(Date.now() + 60000);
			const changedDeadline = new Date(deadline.getTime() + 60000);
			const announcement = await createAnnouncement({ autoArchiveAt: deadline });
			await announcementService.update(announcement, { title: 'Unrelated edit' });
			expect(queueService.clearAnnouncementArchive).not.toHaveBeenCalled();
			expect(queueService.scheduleAnnouncementArchive).not.toHaveBeenCalled();
			await announcementService.update(announcement, { autoArchiveAt: changedDeadline });
			expect(queueService.clearAnnouncementArchive).toHaveBeenCalledWith(announcement.id, deadline);
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(announcement.id, changedDeadline);
			const current = await announcementsRepository.findOneByOrFail({ id: announcement.id });
			await announcementService.update(current, { autoArchiveAt: null });
			expect(queueService.clearAnnouncementArchive).toHaveBeenLastCalledWith(announcement.id, changedDeadline);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).autoArchiveAt).toBeNull();
		});
	});

	describe.todo('read', () => {
		// TODO
	});
});

