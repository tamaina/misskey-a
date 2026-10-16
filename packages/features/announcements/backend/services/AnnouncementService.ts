/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { Brackets, EntityNotFoundError, IsNull, Not } from 'typeorm';
import type { MiUser } from '@features/users/backend/models/User.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, MiAnnouncement, MiAnnouncementRead, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { bindThis } from '@features/runtime/backend/decorators.js';
import { Packed } from '@features/index/backend/packed.schema.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { AnnouncementEntityService } from '../serializers/AnnouncementEntityService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';

export class AnnouncementService {
	constructor(
		private announcementsRepository: AnnouncementsRepository,

		private announcementReadsRepository: AnnouncementReadsRepository,

		private usersRepository: UsersRepository,

		private idService: Pick<IdService, 'gen'>,
		private globalEventService: Pick<GlobalEventService, 'publishBroadcastStream' | 'publishMainStream'>,
		private moderationLogService: Pick<ModerationLogService, 'log'>,
		private announcementEntityService: Pick<AnnouncementEntityService, 'pack'>,
		private queueService: Pick<QueueService, 'scheduleAnnouncementArchive' | 'clearAnnouncementArchive'>,
	) {
	}

	@bindThis
	public async restoreScheduledArchives(): Promise<void> {
		const announcements = await this.announcementsRepository.findBy({ isActive: true, autoArchiveAt: Not(IsNull()) });
		await Promise.all(announcements.map(announcement => this.queueService.scheduleAnnouncementArchive(announcement.id, announcement.autoArchiveAt!)));
	}

	@bindThis
	public async getReads(userId: MiUser['id']): Promise<MiAnnouncementRead[]> {
		return this.announcementReadsRepository.findBy({
			userId: userId,
		});
	}

	@bindThis
	public async getUnreadAnnouncements(user: MiUser): Promise<MiAnnouncement[]> {
		const now = new Date();
		const readsQuery = this.announcementReadsRepository.createQueryBuilder('read')
			.select('read.announcementId')
			.where('read.userId = :userId', { userId: user.id });

		const q = this.announcementsRepository.createQueryBuilder('announcement')
			.where('announcement.isActive = true')
			.andWhere(new Brackets(qb => {
				qb.where('announcement.autoArchiveAt IS NULL');
				qb.orWhere('announcement.autoArchiveAt > :now', { now });
			}))
			.andWhere('announcement.silence = false')
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.userId = :userId', { userId: user.id });
				qb.orWhere('announcement.userId IS NULL');
			}))
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.forExistingUsers = false');
				qb.orWhere('announcement.id > :userId', { userId: user.id });
			}))
			.andWhere(`announcement.id NOT IN (${ readsQuery.getQuery() })`);

		q.setParameters(readsQuery.getParameters());

		return q.getMany();
	}

	@bindThis
	public async create(values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<{ raw: MiAnnouncement; packed: Packed<'Announcement'> }> {
		const announcement = await this.announcementsRepository.insertOne({
			id: this.idService.gen(),
			updatedAt: null,
			title: values.title,
			text: values.text,
			imageUrl: values.imageUrl || null,
			icon: values.icon,
			display: values.display,
			forExistingUsers: values.forExistingUsers,
			silence: values.silence,
			needConfirmationToRead: values.needConfirmationToRead,
			userId: values.userId,
			autoArchiveAt: values.autoArchiveAt ?? null,
			isActive: values.isActive ?? (values.autoArchiveAt == null || values.autoArchiveAt > new Date()),
		});

		const packed = await this.announcementEntityService.pack(announcement);

		if (announcement.isActive && announcement.autoArchiveAt != null) {
			await this.queueService.scheduleAnnouncementArchive(announcement.id, announcement.autoArchiveAt);
		}

		const shouldPublish = announcement.isActive && (announcement.autoArchiveAt == null || announcement.autoArchiveAt > new Date());

		// 作成処理中にautoArchiveAtを過ぎる可能性があるため、配信時点で非アクティブなお知らせはイベント配信しない
		if (values.userId) {
			if (shouldPublish) {
				this.globalEventService.publishMainStream(values.userId, 'announcementCreated', {
					announcement: packed,
				});
			}

			if (moderator) {
				const user = await this.usersRepository.findOneByOrFail({ id: values.userId });
				this.moderationLogService.log(moderator, 'createUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: values.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			}
		} else {
			if (shouldPublish) {
				this.globalEventService.publishBroadcastStream('announcementCreated', {
					announcement: packed,
				});
			}

			if (moderator) {
				this.moderationLogService.log(moderator, 'createGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}

		return {
			raw: announcement,
			packed: packed,
		};
	}

	@bindThis
	public async update(announcement: MiAnnouncement, values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<void> {
		await this.announcementsRepository.update(announcement.id, {
			updatedAt: new Date(),
			title: values.title,
			text: values.text,
			/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
			imageUrl: values.imageUrl || null,
			display: values.display,
			icon: values.icon,
			forExistingUsers: values.forExistingUsers,
			silence: values.silence,
			needConfirmationToRead: values.needConfirmationToRead,
			isActive: values.isActive,
			autoArchiveAt: values.autoArchiveAt,
		});

		const after = await this.announcementsRepository.findOneByOrFail({ id: announcement.id });

		if (announcement.autoArchiveAt?.getTime() !== after.autoArchiveAt?.getTime() || announcement.isActive !== after.isActive) {
			if (announcement.autoArchiveAt != null) {
				await this.queueService.clearAnnouncementArchive(announcement.id, announcement.autoArchiveAt);
			}

			if (after.isActive && after.autoArchiveAt != null) {
				await this.queueService.scheduleAnnouncementArchive(after.id, after.autoArchiveAt);
			}
		}

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'updateUserAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			} else {
				this.moderationLogService.log(moderator, 'updateGlobalAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
				});
			}
		}
	}

	@bindThis
	public async archiveAnnouncement(announcementId: MiAnnouncement['id'], autoArchiveAt: Date): Promise<boolean> {
		const now = new Date();

		// 日時も照合し、日時変更前に予約された古いジョブがお知らせをアーカイブしないようにする
		const result = await this.announcementsRepository.createQueryBuilder()
			.update()
			.set({
				isActive: false,
				updatedAt: now,
			})
			.where('id = :announcementId', { announcementId })
			.andWhere('isActive = true')
			.andWhere('autoArchiveAt = :autoArchiveAt', { autoArchiveAt })
			.andWhere('autoArchiveAt <= :now', { now })
			.execute();

		return (result.affected ?? 0) > 0;
	}

	@bindThis
	public async delete(announcement: MiAnnouncement, moderator?: MiUser): Promise<void> {
		await this.announcementsRepository.delete(announcement.id);

		if (announcement.autoArchiveAt != null) {
			await this.queueService.clearAnnouncementArchive(announcement.id, announcement.autoArchiveAt);
		}

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'deleteUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
				});
			} else {
				this.moderationLogService.log(moderator, 'deleteGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}
	}

	@bindThis
	public async getAnnouncement(announcementId: MiAnnouncement['id'], me: MiUser | null): Promise<Packed<'Announcement'>> {
		const announcement = await this.announcementsRepository.findOneByOrFail({ id: announcementId });

		if (announcement.userId && (me == null || announcement.userId !== me.id)) {
			throw new EntityNotFoundError(this.announcementsRepository.metadata.target, { id: announcementId });
		}

		if (me) {
			const read = await this.announcementReadsRepository.findOneBy({
				announcementId: announcement.id,
				userId: me.id,
			});
			return this.announcementEntityService.pack({ ...announcement, isRead: read !== null }, me);
		} else {
			return this.announcementEntityService.pack(announcement, null);
		}
	}

	@bindThis
	public async read(user: MiUser, announcementId: MiAnnouncement['id']): Promise<void> {
		try {
			await this.announcementReadsRepository.insert({
				id: this.idService.gen(),
				announcementId: announcementId,
				userId: user.id,
			});
		} catch (_) {
			return;
		}

		const announcement = await this.announcementsRepository.findOneBy({ id: announcementId });
		if (announcement != null && announcement.userId === user.id) {
			await this.announcementsRepository.update(announcementId, {
				isActive: false,
			});
		}

		if ((await this.getUnreadAnnouncements(user)).length === 0) {
			this.globalEventService.publishMainStream(user.id, 'readAllAnnouncements');
		}
	}
}
