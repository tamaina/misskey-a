/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InjectionToken, Provider, Type } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { createAnnouncementServices } from '../../../features/announcements/backend/services.js';
import { AnnouncementEntityService } from '../../../features/announcements/backend/serializers/AnnouncementEntityService.js';
import { AnnouncementService } from '../../../features/announcements/backend/services/AnnouncementService.js';
import { createCollectionServices } from '../../../features/collections/backend/services.js';
import { ClipEntityService } from '../../../features/collections/backend/serializers/ClipEntityService.js';
import { NoteFavoriteEntityService } from '../../../features/collections/backend/serializers/NoteFavoriteEntityService.js';
import { ClipService } from '../../../features/collections/backend/services/ClipService.js';
import { createGalleryServices } from '../../../features/gallery/backend/services.js';
import { GalleryPostEntityService } from '../../../features/gallery/backend/serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from '../../../features/gallery/backend/serializers/GalleryLikeEntityService.js';
import { createPageServices } from '../../../features/pages/backend/services.js';
import { PageEntityService } from '../../../features/pages/backend/serializers/PageEntityService.js';
import { PageLikeEntityService } from '../../../features/pages/backend/serializers/PageLikeEntityService.js';
import { PageService } from '../../../features/pages/backend/services/PageService.js';
import { createPlayServices } from '../../../features/play/backend/services.js';
import { FlashEntityService } from '../../../features/play/backend/serializers/FlashEntityService.js';
import { FlashLikeEntityService } from '../../../features/play/backend/serializers/FlashLikeEntityService.js';
import { FlashService } from '../../../features/play/backend/services/FlashService.js';
import { IdService } from '../../../features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '../../../features/runtime/backend/services/GlobalEventService.js';
import { ModerationLogService } from '../../../features/moderation/backend/services/ModerationLogService.js';
import { UserEntityService } from '../../../features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '../../../features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '../../../features/roles/backend/services/RoleService.js';
import { DriveFileEntityService } from '../../../features/drive/backend/serializers/DriveFileEntityService.js';
import { QueryService } from './QueryService.js';

// Nest is a transitional host adapter. Features receive only their named ports;
// one feature factory owns construction, and class/string providers are aliases.
function provideFeatureServices<Dependencies extends object, Services extends Record<string, object>>(
	name: string,
	create: (dependencies: Dependencies) => Services,
	dependencies: { [Key in keyof Dependencies]: InjectionToken<Dependencies[Key]> },
	services: { [Key in keyof Services]: Type<Services[Key]> },
): { providers: Provider[]; exports: InjectionToken[] } {
	const featureToken = Symbol(`${name} services`);
	const dependencyNames = Object.keys(dependencies) as (keyof Dependencies)[];
	const serviceNames = Object.keys(services) as (keyof Services & string)[];
	const providers: Provider[] = [{
		provide: featureToken,
		inject: dependencyNames.map(key => dependencies[key]),
		useFactory: (...values: unknown[]) => {
			const ports = {} as Dependencies;
			for (const [index, key] of dependencyNames.entries()) {
				ports[key] = values[index] as Dependencies[typeof key];
			}
			return create(ports);
		},
	}, ...serviceNames.flatMap((key): Provider[] => [{
		provide: services[key],
		inject: [featureToken],
		useFactory: (feature: Services) => feature[key],
	}, {
		provide: key,
		useExisting: services[key],
	}])];

	return { providers, exports: serviceNames.flatMap(key => [services[key], key]) };
}

const announcements = provideFeatureServices('announcements', createAnnouncementServices, {
	announcementsRepository: DI.announcementsRepository,
	announcementReadsRepository: DI.announcementReadsRepository,
	idService: IdService,
	usersRepository: DI.usersRepository,
	globalEventService: GlobalEventService,
	moderationLogService: ModerationLogService,
}, { AnnouncementEntityService, AnnouncementService });

const collections = provideFeatureServices('collections', createCollectionServices, {
	clipsRepository: DI.clipsRepository,
	clipNotesRepository: DI.clipNotesRepository,
	clipFavoritesRepository: DI.clipFavoritesRepository,
	userEntityService: UserEntityService,
	idService: IdService,
	noteFavoritesRepository: DI.noteFavoritesRepository,
	noteEntityService: NoteEntityService,
	notesRepository: DI.notesRepository,
	roleService: RoleService,
}, { ClipEntityService, NoteFavoriteEntityService, ClipService });

const gallery = provideFeatureServices('gallery', createGalleryServices, {
	galleryPostsRepository: DI.galleryPostsRepository,
	galleryLikesRepository: DI.galleryLikesRepository,
	userEntityService: UserEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
}, { GalleryPostEntityService, GalleryLikeEntityService });

const pages = provideFeatureServices('pages', createPageServices, {
	pagesRepository: DI.pagesRepository,
	pageLikesRepository: DI.pageLikesRepository,
	driveFilesRepository: DI.driveFilesRepository,
	userEntityService: UserEntityService,
	driveFileEntityService: DriveFileEntityService,
	idService: IdService,
	db: DI.db,
	notesRepository: DI.notesRepository,
	usersRepository: DI.usersRepository,
	roleService: RoleService,
	moderationLogService: ModerationLogService,
}, { PageEntityService, PageLikeEntityService, PageService });

const play = provideFeatureServices('play', createPlayServices, {
	flashsRepository: DI.flashsRepository,
	flashLikesRepository: DI.flashLikesRepository,
	userEntityService: UserEntityService,
	idService: IdService,
	queryService: QueryService,
}, { FlashEntityService, FlashLikeEntityService, FlashService });

// Selective composition roots (including tests) reuse the same typed wiring.
export const featureServiceGroups = { announcements, collections, gallery, pages, play };
const features = Object.values(featureServiceGroups);

export const featureServiceProviders: Provider[] = features.flatMap(feature => feature.providers);
// The legacy FlashService string alias was private; its class token is exported.
export const featureServiceExports = features.flatMap(feature => feature.exports).filter(token => token !== 'FlashService');
