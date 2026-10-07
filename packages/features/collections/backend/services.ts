/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ClipEntityService } from './serializers/ClipEntityService.js';
import { NoteFavoriteEntityService } from './serializers/NoteFavoriteEntityService.js';
import { ClipService } from './services/ClipService.js';
import type { ClipFavoritesRepository, ClipNotesRepository, ClipsRepository, NoteFavoritesRepository, NotesRepository } from '@/models/_.js';
import type { UserEntityService } from '../../users/backend/serializers/UserEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { NoteEntityService } from '../../notes/backend/serializers/NoteEntityService.js';
import type { RoleService } from '../../roles/backend/services/RoleService.js';

export interface CollectionServicesDependencies {
	clipsRepository: ClipsRepository;
	clipNotesRepository: ClipNotesRepository;
	clipFavoritesRepository: ClipFavoritesRepository;
	userEntityService: Pick<UserEntityService, 'pack' | 'packMany'>;
	idService: Pick<IdService, 'gen' | 'parse'>;
	noteFavoritesRepository: NoteFavoritesRepository;
	noteEntityService: Pick<NoteEntityService, 'pack'>;
	notesRepository: NotesRepository;
	roleService: Pick<RoleService, 'getUserPolicies'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createCollectionServices(deps: CollectionServicesDependencies) {
	const clipEntityService = new ClipEntityService(deps.clipsRepository, deps.clipNotesRepository, deps.clipFavoritesRepository, deps.userEntityService, deps.idService);
	const noteFavoriteEntityService = new NoteFavoriteEntityService(deps.noteFavoritesRepository, deps.noteEntityService, deps.idService);
	const clipService = new ClipService(deps.clipsRepository, deps.clipNotesRepository, deps.notesRepository, deps.roleService, deps.idService);

	return {
		ClipEntityService: clipEntityService,
		NoteFavoriteEntityService: noteFavoriteEntityService,
		ClipService: clipService,
	};
}

export type CollectionServices = ReturnType<typeof createCollectionServices>;
