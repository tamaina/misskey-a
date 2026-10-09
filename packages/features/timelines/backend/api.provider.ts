/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { AntennaEntityService } from './serializers/AntennaEntityService.js';
import type { UserListsRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ChannelMutingService } from '@features/channels/backend/services/ChannelMutingService.js';
import { FanoutTimelineService } from './services/FanoutTimelineService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { CacheService } from '@features/users/backend/services/CacheService.js';
import { UserFollowingService } from '@features/relationships/backend/services/UserFollowingService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';
import { FanoutTimelineEndpointService } from './services/FanoutTimelineEndpointService.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import type { UserListMembershipsRepository } from '@features/persistence/backend/repositories/models.js';
import { createTimelinesRouter } from './router.js';
type TimelinesRouter = ReturnType<typeof createTimelinesRouter<MiLocalUser>>;
/** Composed once after Nest initialization; domain services keep their existing lifetime. */
@Injectable()
export class TimelinesApiProvider {
	private router: TimelinesRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): TimelinesRouter {
		if (this.router !== undefined) return this.router;
		this.router = createTimelinesRouter<MiLocalUser>({
			antennasRepository: this.moduleRef.get<AntennasRepository>(DI.antennasRepository, { strict: false }),
			userListsRepository: this.moduleRef.get<UserListsRepository>(DI.userListsRepository, { strict: false }),
			antennaEntityService: this.moduleRef.get(AntennaEntityService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			fanoutTimelineService: this.moduleRef.get(FanoutTimelineService, { strict: false }),
			channelMutingService: this.moduleRef.get(ChannelMutingService, { strict: false }),
			activeUsersChart: this.moduleRef.get(ActiveUsersChart, { strict: false }),
			serverSettings: this.moduleRef.get<MiMeta>(DI.meta, { strict: false }),
			cacheService: this.moduleRef.get(CacheService, { strict: false }),
			userFollowingService: this.moduleRef.get(UserFollowingService, { strict: false }),
			channelFollowingService: this.moduleRef.get(ChannelFollowingService, { strict: false }),
			fanoutTimelineEndpointService: this.moduleRef.get(FanoutTimelineEndpointService, { strict: false }),
			followingsRepository: this.moduleRef.get<FollowingsRepository>(DI.followingsRepository, { strict: false }),
			userListMembershipsRepository: this.moduleRef.get<UserListMembershipsRepository>(DI.userListMembershipsRepository, { strict: false }),
		});
		return this.router;
	}
}
