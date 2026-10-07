/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { PageEntityService } from './serializers/PageEntityService.js';
import { PageLikeEntityService } from './serializers/PageLikeEntityService.js';
import { PageService } from './services/PageService.js';

const pageEntityService = service(PageEntityService, [ports.pagesRepository, ports.pageLikesRepository, ports.driveFilesRepository, ports.userEntityService, ports.driveFileEntityService, ports.idService]);
export const pageServices = defineServices({
	PageEntityService: pageEntityService,
	PageLikeEntityService: service(PageLikeEntityService, [ports.pageLikesRepository, pageEntityService]),
	PageService: service(PageService, [ports.db, ports.pagesRepository, ports.notesRepository, ports.usersRepository, ports.roleService, ports.moderationLogService, ports.idService]),
});
