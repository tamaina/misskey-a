/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiAnnouncement } from './models/Announcement.js';
import { announcementsContract } from './api.definition.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
import { implement } from '@orpc/server';
import { createAnnouncementCreateProcedure } from './endpoints/admin/announcements/create.js';
import { createAnnouncementDeleteProcedure } from './endpoints/admin/announcements/delete.js';
import { createAnnouncementUpdateProcedure } from './endpoints/admin/announcements/update.js';
import { createAnnouncementAdminListProcedure } from './endpoints/admin/announcements/list.js';
import { createAnnouncementsListProcedure } from './endpoints/announcements.js';
import { createAnnouncementShowProcedure } from './endpoints/announcements/show.js';
import { createReadAnnouncementProcedure } from './endpoints/i/read-announcement.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { AnnouncementService } from './services/AnnouncementService.js';
import { AnnouncementEntityService } from './serializers/AnnouncementEntityService.js';

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

export function createAnnouncementsRouter<Actor extends ApiActor>(deps: AnnouncementsDependencies<Actor>) {
	return implement(announcementsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		create: createAnnouncementCreateProcedure(deps),
		delete: createAnnouncementDeleteProcedure(deps),
		update: createAnnouncementUpdateProcedure(deps),
		adminList: createAnnouncementAdminListProcedure(deps),
		list: createAnnouncementsListProcedure(deps),
		show: createAnnouncementShowProcedure(deps),
		read: createReadAnnouncementProcedure(deps),
	});
}

type AnnouncementsRouter = ReturnType<typeof createAnnouncementsRouter<MiLocalUser>>;

/** Root registration composes this once after Nest initialization has completed. */
@Injectable()
export class AnnouncementsApiProvider {
	private router: AnnouncementsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): AnnouncementsRouter {
		if (this.router !== undefined) return this.router;
		const service = this.moduleRef.get(AnnouncementService, { strict: false });
		const serializer = this.moduleRef.get(AnnouncementEntityService, { strict: false });
		this.router = createAnnouncementsRouter<MiLocalUser>({
			announcementsRepository: this.moduleRef.get<AnnouncementsRepository>(DI.announcementsRepository, { strict: false }),
			announcementReadsRepository: this.moduleRef.get<AnnouncementReadsRepository>(DI.announcementReadsRepository, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			announcementEntityService: { packMany: (rows, actor) => serializer.packMany(rows, actor) },
			announcementService: {
				create: (values, actor) => service.create(values, actor),
				update: (row, values, actor) => service.update(row, values, actor),
				delete: (row, actor) => service.delete(row, actor),
				getAnnouncement: (id, actor) => service.getAnnouncement(id, actor),
				read: (actor, id) => service.read(actor, id),
			},
		});
		return this.router;
	}
}
