/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { channelsApiContract } from './api.contract.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { ChannelsApiContext } from './operations.js';
import { createChannelsCreateProcedure } from './endpoints/channels/create.js';
import { createChannelsFavoriteProcedure } from './endpoints/channels/favorite.js';
import { createChannelsFeaturedProcedure } from './endpoints/channels/featured.js';
import { createChannelsFollowProcedure } from './endpoints/channels/follow.js';
import { createChannelsFollowedProcedure } from './endpoints/channels/followed.js';
import { createChannelsMyFavoritesProcedure } from './endpoints/channels/my-favorites.js';
import { createChannelsOwnedProcedure } from './endpoints/channels/owned.js';
import { createChannelsSearchProcedure } from './endpoints/channels/search.js';
import { createChannelsShowProcedure } from './endpoints/channels/show.js';
import { createChannelsTimelineProcedure } from './endpoints/channels/timeline.js';
import { createChannelsUnfavoriteProcedure } from './endpoints/channels/unfavorite.js';
import { createChannelsUnfollowProcedure } from './endpoints/channels/unfollow.js';
import { createChannelsUpdateProcedure } from './endpoints/channels/update.js';
import { createChannelsMuteCreateProcedure } from './endpoints/channels/mute/create.js';
import { createChannelsMuteDeleteProcedure } from './endpoints/channels/mute/delete.js';
import { createChannelsMuteListProcedure } from './endpoints/channels/mute/list.js';

export function createChannelsRouter<Actor extends ApiActor>() {
	return implement(channelsApiContract).$context<ChannelsApiContext<Actor>>().router({
		channelsCreate: createChannelsCreateProcedure<Actor>(),
		channelsFavorite: createChannelsFavoriteProcedure<Actor>(),
		channelsFeatured: createChannelsFeaturedProcedure<Actor>(),
		channelsFollow: createChannelsFollowProcedure<Actor>(),
		channelsFollowed: createChannelsFollowedProcedure<Actor>(),
		channelsMyFavorites: createChannelsMyFavoritesProcedure<Actor>(),
		channelsOwned: createChannelsOwnedProcedure<Actor>(),
		channelsSearch: createChannelsSearchProcedure<Actor>(),
		channelsShow: createChannelsShowProcedure<Actor>(),
		channelsTimeline: createChannelsTimelineProcedure<Actor>(),
		channelsUnfavorite: createChannelsUnfavoriteProcedure<Actor>(),
		channelsUnfollow: createChannelsUnfollowProcedure<Actor>(),
		channelsUpdate: createChannelsUpdateProcedure<Actor>(),
		channelsMuteCreate: createChannelsMuteCreateProcedure<Actor>(),
		channelsMuteDelete: createChannelsMuteDeleteProcedure<Actor>(),
		channelsMuteList: createChannelsMuteListProcedure<Actor>(),
	});
}
