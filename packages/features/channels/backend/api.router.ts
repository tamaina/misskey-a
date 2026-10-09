/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsApiContract } from './api.contract.js';
import { createChannelsCreateProcedure, type ChannelsCreateDependencies } from './endpoints/channels/create.js';
import { createChannelsFavoriteProcedure, type ChannelsFavoriteDependencies } from './endpoints/channels/favorite.js';
import { createChannelsFeaturedProcedure, type ChannelsFeaturedDependencies } from './endpoints/channels/featured.js';
import { createChannelsFollowProcedure, type ChannelsFollowDependencies } from './endpoints/channels/follow.js';
import { createChannelsFollowedProcedure, type ChannelsFollowedDependencies } from './endpoints/channels/followed.js';
import { createChannelsMyFavoritesProcedure, type ChannelsMyFavoritesDependencies } from './endpoints/channels/my-favorites.js';
import { createChannelsOwnedProcedure, type ChannelsOwnedDependencies } from './endpoints/channels/owned.js';
import { createChannelsSearchProcedure, type ChannelsSearchDependencies } from './endpoints/channels/search.js';
import { createChannelsShowProcedure, type ChannelsShowDependencies } from './endpoints/channels/show.js';
import { createChannelsTimelineProcedure, type ChannelsTimelineDependencies } from './endpoints/channels/timeline.js';
import { createChannelsUnfavoriteProcedure, type ChannelsUnfavoriteDependencies } from './endpoints/channels/unfavorite.js';
import { createChannelsUnfollowProcedure, type ChannelsUnfollowDependencies } from './endpoints/channels/unfollow.js';
import { createChannelsUpdateProcedure, type ChannelsUpdateDependencies } from './endpoints/channels/update.js';
import { createChannelsMuteCreateProcedure, type ChannelsMuteCreateDependencies } from './endpoints/channels/mute/create.js';
import { createChannelsMuteDeleteProcedure, type ChannelsMuteDeleteDependencies } from './endpoints/channels/mute/delete.js';
import { createChannelsMuteListProcedure, type ChannelsMuteListDependencies } from './endpoints/channels/mute/list.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
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
