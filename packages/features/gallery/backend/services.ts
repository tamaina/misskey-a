/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { GalleryPostEntityService } from './serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from './serializers/GalleryLikeEntityService.js';
import type { GalleryLikesRepository, GalleryPostsRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { DriveFileEntityService } from '../../drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface GalleryServicesDependencies {
	galleryPostsRepository: GalleryPostsRepository;
	galleryLikesRepository: GalleryLikesRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	driveFileEntityService: Pick<DriveFileEntityService, 'packManyByIds'>;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createGalleryServices(deps: GalleryServicesDependencies) {
	const galleryPostEntityService = new GalleryPostEntityService(deps.galleryPostsRepository, deps.galleryLikesRepository, deps.userEntityService, deps.driveFileEntityService, deps.idService);
	const galleryLikeEntityService = new GalleryLikeEntityService(deps.galleryLikesRepository, galleryPostEntityService);

	return {
		GalleryPostEntityService: galleryPostEntityService,
		GalleryLikeEntityService: galleryLikeEntityService,
	};
}

export type GalleryServices = ReturnType<typeof createGalleryServices>;
