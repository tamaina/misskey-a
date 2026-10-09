/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { QueryService } from '../../notes/backend/services/QueryService.js';
import { IdService } from '../../runtime/backend/services/IdService.js';
import { AnnouncementService } from './services/AnnouncementService.js';
import { AnnouncementEntityService } from './serializers/AnnouncementEntityService.js';
import { createAnnouncementsRouter } from './api.router.js';
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
