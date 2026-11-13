/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { FactoryProvider, Provider } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, PageLikesRepository, NotesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { DriveFileEntityService } from '@features/drive/backend/serializers/DriveFileEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { PageEntityService, type PagePackingRepository } from './serializers/PageEntityService.js';
import { PageLikeEntityService } from './serializers/PageLikeEntityService.js';
import { PageService, type PageDatabase, type PageWriteRepository } from './services/PageService.js';

export function createPageEntityService(
	pagesRepository: PagePackingRepository,
	pageLikesRepository: PageLikesRepository,
	driveFilesRepository: DriveFilesRepository,
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>,
	driveFileEntityService: Pick<DriveFileEntityService, 'pack' | 'packMany'>,
	idService: Pick<IdService, 'parse'>,
): PageEntityService {
	return new PageEntityService(pagesRepository, pageLikesRepository, driveFilesRepository, userEntityService, driveFileEntityService, idService);
}

export function createPageLikeEntityService(
	pageLikesRepository: PageLikesRepository,
	pageEntityService: Pick<PageEntityService, 'pack'>,
): PageLikeEntityService {
	return new PageLikeEntityService(pageLikesRepository, pageEntityService);
}

export const pageEntityServiceProvider: FactoryProvider<PageEntityService> = {
	provide: PageEntityService,
	inject: [DI.pagesRepository, DI.pageLikesRepository, DI.driveFilesRepository, UserEntityService, DriveFileEntityService, IdService],
	useFactory: createPageEntityService,
};

export const pageLikeEntityServiceProvider: FactoryProvider<PageLikeEntityService> = {
	provide: PageLikeEntityService,
	inject: [DI.pageLikesRepository, PageEntityService],
	useFactory: createPageLikeEntityService,
};

export function createPageService(
	db: PageDatabase,
	pagesRepository: PageWriteRepository,
	notesRepository: NotesRepository,
	usersRepository: UsersRepository,
	roleService: Pick<RoleService, 'isModerator'>,
	moderationLogService: Pick<ModerationLogService, 'log'>,
	idService: Pick<IdService, 'gen'>,
): PageService {
	return new PageService(db, pagesRepository, notesRepository, usersRepository, roleService, moderationLogService, idService);
}

export const pageServiceProvider: FactoryProvider<PageService> = {
	provide: PageService,
	inject: [DI.db, DI.pagesRepository, DI.notesRepository, DI.usersRepository, RoleService, ModerationLogService, IdService],
	useFactory: createPageService,
};

export const pageFactoryProviders = [pageEntityServiceProvider, pageLikeEntityServiceProvider, pageServiceProvider];
export const pageProviders: Provider[] = [
	...pageFactoryProviders,
	{ provide: 'PageEntityService', useExisting: PageEntityService },
	{ provide: 'PageLikeEntityService', useExisting: PageLikeEntityService },
	{ provide: 'PageService', useExisting: PageService },
];
export const pageExports = [PageEntityService, 'PageEntityService', PageLikeEntityService, 'PageLikeEntityService', PageService, 'PageService'];
