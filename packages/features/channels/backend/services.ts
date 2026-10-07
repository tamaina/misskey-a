/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ChannelEntityService } from './serializers/ChannelEntityService.js';
import type { ChannelFavoritesRepository, ChannelFollowingsRepository, ChannelMutingRepository, ChannelsRepository, DriveFilesRepository, NotesRepository } from '@/models/_.js';
import type { NoteEntityService } from '../../notes/backend/serializers/NoteEntityService.js';
import type { DriveFileEntityService } from '../../drive/backend/serializers/DriveFileEntityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface ChannelServicesDependencies {
	channelsRepository: ChannelsRepository;
	channelFollowingsRepository: ChannelFollowingsRepository;
	channelFavoritesRepository: ChannelFavoritesRepository;
	channelMutingRepository: ChannelMutingRepository;
	notesRepository: NotesRepository;
	driveFilesRepository: DriveFilesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	driveFileEntityService: Pick<DriveFileEntityService, 'getPublicUrl'>;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createChannelServices(deps: ChannelServicesDependencies) {
	const channelEntityService = new ChannelEntityService(deps.channelsRepository, deps.channelFollowingsRepository, deps.channelFavoritesRepository, deps.channelMutingRepository, deps.notesRepository, deps.driveFilesRepository, deps.noteEntityService, deps.driveFileEntityService, deps.idService);

	return {
		ChannelEntityService: channelEntityService,
	};
}

export type ChannelServices = ReturnType<typeof createChannelServices>;
