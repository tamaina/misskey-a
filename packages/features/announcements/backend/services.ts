/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AnnouncementEntityService } from './serializers/AnnouncementEntityService.js';
import { AnnouncementService } from './services/AnnouncementService.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, UsersRepository } from '@/models/_.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { GlobalEventService } from '../../runtime/backend/services/GlobalEventService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';

export interface AnnouncementServicesDependencies {
	announcementsRepository: AnnouncementsRepository;
	announcementReadsRepository: AnnouncementReadsRepository;
	idService: Pick<IdService, 'gen' | 'parse'>;
	usersRepository: UsersRepository;
	globalEventService: Pick<GlobalEventService, 'publishBroadcastStream' | 'publishMainStream'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createAnnouncementServices(deps: AnnouncementServicesDependencies) {
	const announcementEntityService = new AnnouncementEntityService(deps.announcementsRepository, deps.announcementReadsRepository, deps.idService);
	const announcementService = new AnnouncementService(deps.announcementsRepository, deps.announcementReadsRepository, deps.usersRepository, deps.idService, deps.globalEventService, deps.moderationLogService, announcementEntityService);

	return {
		AnnouncementEntityService: announcementEntityService,
		AnnouncementService: announcementService,
	};
}

export type AnnouncementServices = ReturnType<typeof createAnnouncementServices>;
