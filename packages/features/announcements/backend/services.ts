/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { AnnouncementEntityService } from './serializers/AnnouncementEntityService.js';
import { AnnouncementService } from './services/AnnouncementService.js';

const announcementEntityService = service(AnnouncementEntityService, [ports.announcementsRepository, ports.announcementReadsRepository, ports.idService]);
export const announcementServices = defineServices({
	AnnouncementEntityService: announcementEntityService,
	AnnouncementService: service(AnnouncementService, [ports.announcementsRepository, ports.announcementReadsRepository, ports.usersRepository, ports.idService, ports.globalEventService, ports.moderationLogService, announcementEntityService]),
});
