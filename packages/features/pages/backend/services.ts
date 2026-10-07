/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PageEntityService } from './serializers/PageEntityService.js';
import { PageLikeEntityService } from './serializers/PageLikeEntityService.js';
import { PageService } from './services/PageService.js';
import type { DriveFilesRepository, NotesRepository, PageLikesRepository, PagesRepository, UsersRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '../../drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { DataSource } from 'typeorm';
import type { RoleService } from '../../roles/backend/services/RoleService.js';
import type { ModerationLogService } from '../../moderation/backend/services/ModerationLogService.js';

export interface PageServicesDependencies {
	pagesRepository: PagesRepository;
	pageLikesRepository: PageLikesRepository;
	driveFilesRepository: DriveFilesRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	driveFileEntityService: Pick<DriveFileEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	db: DataSource;
	notesRepository: NotesRepository;
	usersRepository: UsersRepository;
	roleService: Pick<RoleService, 'isModerator'>;
	moderationLogService: Pick<ModerationLogService, 'log'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createPageServices(deps: PageServicesDependencies) {
	const pageEntityService = new PageEntityService(deps.pagesRepository, deps.pageLikesRepository, deps.driveFilesRepository, deps.userEntityService, deps.driveFileEntityService, deps.idService);
	const pageLikeEntityService = new PageLikeEntityService(deps.pageLikesRepository, pageEntityService);
	const pageService = new PageService(deps.db, deps.pagesRepository, deps.notesRepository, deps.usersRepository, deps.roleService, deps.moderationLogService, deps.idService);

	return {
		PageEntityService: pageEntityService,
		PageLikeEntityService: pageLikeEntityService,
		PageService: pageService,
	};
}

export type PageServices = ReturnType<typeof createPageServices>;
