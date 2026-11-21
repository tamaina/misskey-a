/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsApiContract } from './api.definition.js';
import { createChannelsCreateProcedure } from './endpoints/channels/create.js';
import type { ChannelsCreateDependencies } from './endpoints/channels/create.js';
import { createChannelsFavoriteProcedure } from './endpoints/channels/favorite.js';
import type { ChannelsFavoriteDependencies } from './endpoints/channels/favorite.js';
import { createChannelsFeaturedProcedure } from './endpoints/channels/featured.js';
import type { ChannelsFeaturedDependencies } from './endpoints/channels/featured.js';
import { createChannelsFollowProcedure } from './endpoints/channels/follow.js';
import type { ChannelsFollowDependencies } from './endpoints/channels/follow.js';
import { createChannelsFollowedProcedure } from './endpoints/channels/followed.js';
import type { ChannelsFollowedDependencies } from './endpoints/channels/followed.js';
import { createChannelsMyFavoritesProcedure } from './endpoints/channels/my-favorites.js';
import type { ChannelsMyFavoritesDependencies } from './endpoints/channels/my-favorites.js';
import { createChannelsOwnedProcedure } from './endpoints/channels/owned.js';
import type { ChannelsOwnedDependencies } from './endpoints/channels/owned.js';
import { createChannelsSearchProcedure } from './endpoints/channels/search.js';
import type { ChannelsSearchDependencies } from './endpoints/channels/search.js';
import { createChannelsShowProcedure } from './endpoints/channels/show.js';
import type { ChannelsShowDependencies } from './endpoints/channels/show.js';
import { createChannelsTimelineProcedure } from './endpoints/channels/timeline.js';
import type { ChannelsTimelineDependencies } from './endpoints/channels/timeline.js';
import { createChannelsUnfavoriteProcedure } from './endpoints/channels/unfavorite.js';
import type { ChannelsUnfavoriteDependencies } from './endpoints/channels/unfavorite.js';
import { createChannelsUnfollowProcedure } from './endpoints/channels/unfollow.js';
import type { ChannelsUnfollowDependencies } from './endpoints/channels/unfollow.js';
import { createChannelsUpdateProcedure } from './endpoints/channels/update.js';
import type { ChannelsUpdateDependencies } from './endpoints/channels/update.js';
import { createChannelsMuteCreateProcedure } from './endpoints/channels/mute/create.js';
import type { ChannelsMuteCreateDependencies } from './endpoints/channels/mute/create.js';
import { createChannelsMuteDeleteProcedure } from './endpoints/channels/mute/delete.js';
import type { ChannelsMuteDeleteDependencies } from './endpoints/channels/mute/delete.js';
import { createChannelsMuteListProcedure } from './endpoints/channels/mute/list.js';
import type { ChannelsMuteListDependencies } from './endpoints/channels/mute/list.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ChannelEntityService } from './serializers/ChannelEntityService.js';
import type { ChannelsRepository, DriveFilesRepository, ChannelFollowingsRepository, ChannelFavoritesRepository, MiMeta, NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { ChannelMutingService } from './services/ChannelMutingService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ActiveUsersChart } from '@features/statistics/backend/charts/active-users.js';
import { FanoutTimelineEndpointService } from '@features/timelines/backend/services/FanoutTimelineEndpointService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ChannelFollowingService } from '@features/channels/backend/services/ChannelFollowingService.js';

export type ChannelsDependencies = ChannelsCreateDependencies & ChannelsFeaturedDependencies & ChannelsFollowedDependencies & ChannelsMuteListDependencies & ChannelsMyFavoritesDependencies & ChannelsOwnedDependencies & ChannelsSearchDependencies & ChannelsShowDependencies & ChannelsTimelineDependencies & ChannelsUpdateDependencies & ChannelsFavoriteDependencies & ChannelsFollowDependencies & ChannelsUnfavoriteDependencies & ChannelsUnfollowDependencies & ChannelsMuteCreateDependencies & ChannelsMuteDeleteDependencies;

export function createChannelsRouter<Actor extends MiLocalUser>(deps: ChannelsDependencies) {
	return implement(channelsApiContract).$context<ApiContext<Actor>>().router({
		channelsCreate: createChannelsCreateProcedure<Actor>(deps),
		channelsFavorite: createChannelsFavoriteProcedure<Actor>(deps),
		channelsFeatured: createChannelsFeaturedProcedure<Actor>(deps),
		channelsFollow: createChannelsFollowProcedure<Actor>(deps),
		channelsFollowed: createChannelsFollowedProcedure<Actor>(deps),
		channelsMyFavorites: createChannelsMyFavoritesProcedure<Actor>(deps),
		channelsOwned: createChannelsOwnedProcedure<Actor>(deps),
		channelsSearch: createChannelsSearchProcedure<Actor>(deps),
		channelsShow: createChannelsShowProcedure<Actor>(deps),
		channelsTimeline: createChannelsTimelineProcedure<Actor>(deps),
		channelsUnfavorite: createChannelsUnfavoriteProcedure<Actor>(deps),
		channelsUnfollow: createChannelsUnfollowProcedure<Actor>(deps),
		channelsUpdate: createChannelsUpdateProcedure<Actor>(deps),
		channelsMuteCreate: createChannelsMuteCreateProcedure<Actor>(deps),
		channelsMuteDelete: createChannelsMuteDeleteProcedure<Actor>(deps),
		channelsMuteList: createChannelsMuteListProcedure<Actor>(deps),
	});
}

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
