/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { GalleryPostEntityService } from './serializers/GalleryPostEntityService.js';
import { GalleryLikeEntityService } from './serializers/GalleryLikeEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

const galleryPostEntityService = service(GalleryPostEntityService, [ports.galleryPostsRepository, ports.galleryLikesRepository, ports.userEntityService, ports.driveFileEntityService, ports.idService]);
export const galleryServices = defineServices({
	GalleryPostEntityService: galleryPostEntityService,
	GalleryLikeEntityService: service(GalleryLikeEntityService, [ports.galleryLikesRepository, galleryPostEntityService]),
});
export const createGalleryServices = galleryServices.create;
export type GalleryServicesDependencies = Inputs<typeof galleryServices>;
export type GalleryServices = Outputs<typeof galleryServices>;
