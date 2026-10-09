/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ChannelEntityService } from './serializers/ChannelEntityService.js';
import type { ChannelsRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { ChannelFollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { ChannelMutingService } from './services/ChannelMutingService.js';
import type { ChannelFavoritesRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import type { MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { createChannelsRouter } from './api.router.js';
type ChannelsRouter = ReturnType<typeof createChannelsRouter<MiLocalUser>>;
/** Composed once after Nest initialization; domain services keep their existing lifetime. */
@Injectable()
export class ChannelsApiProvider {
	private router: ChannelsRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): ChannelsRouter {
		if (this.router !== undefined) return this.router;
		this.router = createChannelsRouter<MiLocalUser>({
			driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
			channelsRepository: this.moduleRef.get<ChannelsRepository>(DI.channelsRepository, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			channelEntityService: this.moduleRef.get(ChannelEntityService, { strict: false }),
			channelFollowingsRepository: this.moduleRef.get<ChannelFollowingsRepository>(DI.channelFollowingsRepository, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			channelMutingService: this.moduleRef.get(ChannelMutingService, { strict: false }),
			channelFavoritesRepository: this.moduleRef.get<ChannelFavoritesRepository>(DI.channelFavoritesRepository, { strict: false }),
			serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			fanoutTimelineEndpointService: this.moduleRef.get(FanoutTimelineEndpointService, { strict: false }),
			activeUsersChart: this.moduleRef.get(ActiveUsersChart, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			channelFollowingService: this.moduleRef.get(ChannelFollowingService, { strict: false }),
		});
		return this.router;
	}
}
