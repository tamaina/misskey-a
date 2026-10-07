/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { ClipEntityService } from './serializers/ClipEntityService.js';
import { NoteFavoriteEntityService } from './serializers/NoteFavoriteEntityService.js';
import { ClipService } from './services/ClipService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const collectionServices = defineServices({
	ClipEntityService: service(ClipEntityService, [ports.clipsRepository, ports.clipNotesRepository, ports.clipFavoritesRepository, ports.userEntityService, ports.idService]),
	NoteFavoriteEntityService: service(NoteFavoriteEntityService, [ports.noteFavoritesRepository, ports.noteEntityService, ports.idService]),
	ClipService: service(ClipService, [ports.clipsRepository, ports.clipNotesRepository, ports.notesRepository, ports.roleService, ports.idService]),
});
export const createCollectionServices = collectionServices.create;
export type CollectionServicesDependencies = Inputs<typeof collectionServices>;
export type CollectionServices = Outputs<typeof collectionServices>;
