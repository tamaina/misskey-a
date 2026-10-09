/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '../../persistence/backend/repositories/models.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiAnnouncement } from './models/Announcement.js';
import type { announcementsContract } from './api.contract.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
export interface AnnouncementUpdateValues {
	updatedAt: Date;
	title: string | undefined;
	text: string | undefined;
	imageUrl: string | null;
	display: MiAnnouncement['display'] | undefined;
	icon: MiAnnouncement['icon'] | undefined;
	forExistingUsers: boolean | undefined;
	silence: boolean | undefined;
	needConfirmationToRead: boolean | undefined;
	isActive: boolean | undefined;
}
type Outputs = InferContractRouterOutputs<typeof announcementsContract>;
export interface AnnouncementsDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsRepository, 'createQueryBuilder' | 'findOneBy'>;
	announcementReadsRepository: Pick<AnnouncementReadsRepository, 'countBy'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	idService: Pick<IdService, 'parse'>;
	announcementEntityService: {
		packMany(rows: MiAnnouncement[], actor: Actor | null): Promise<Outputs['list']>;
	};
	announcementService: {
		create(values: Partial<MiAnnouncement>, actor: Actor): Promise<{ packed: Outputs['create'] }>;
		update(row: MiAnnouncement, values: AnnouncementUpdateValues, actor: Actor): Promise<void>;
		delete(row: MiAnnouncement, actor: Actor): Promise<void>;
		getAnnouncement(id: string, actor: Actor | null): Promise<Outputs['show']>;
		read(actor: Actor, id: string): Promise<void>;
	};
}
