/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineAdminAnnouncementsListDefinition, inlineAdminAnnouncementsListInput, inlineAdminAnnouncementsListOutput } from '../../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@/models/_.js';
import type { MiAnnouncement } from '../../../models/Announcement.js';

import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';

const contractProjection = projectEndpointContract(inlineAdminAnnouncementsListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:announcements',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminAnnouncementsListInput, typeof inlineAdminAnnouncementsListOutput> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private queryService: QueryService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

			if (ps.status === 'archived') {
				query.andWhere('announcement.isActive = false');
			} else if (ps.status === 'active') {
				query.andWhere('announcement.isActive = true');
			}

			if (ps.userId) {
				query.andWhere('announcement.userId = :userId', { userId: ps.userId });
			} else {
				query.andWhere('announcement.userId IS NULL');
			}

			const announcements = await query.limit(ps.limit).getMany();

			const reads = new Map<MiAnnouncement, number>();

			for (const announcement of announcements) {
				reads.set(announcement, await this.announcementReadsRepository.countBy({
					announcementId: announcement.id,
				}));
			}

			return announcements.map(announcement => ({
				id: announcement.id,
				createdAt: this.idService.parse(announcement.id).date.toISOString(),
				updatedAt: announcement.updatedAt?.toISOString() ?? null,
				title: announcement.title,
				text: announcement.text,
				imageUrl: announcement.imageUrl,
				icon: announcement.icon,
				display: announcement.display,
				isActive: announcement.isActive,
				forExistingUsers: announcement.forExistingUsers,
				silence: announcement.silence,
				needConfirmationToRead: announcement.needConfirmationToRead,
				userId: announcement.userId,
				reads: reads.get(announcement)!,
			}));
		});
	}
}
