/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { channelsCreateContract } from './endpoints/channels/create.contract.js';
import { channelsFavoriteContract } from './endpoints/channels/favorite.contract.js';
import { channelsFeaturedContract } from './endpoints/channels/featured.contract.js';
import { channelsFollowContract } from './endpoints/channels/follow.contract.js';
import { channelsFollowedContract } from './endpoints/channels/followed.contract.js';
import { channelsMyFavoritesContract } from './endpoints/channels/my-favorites.contract.js';
import { channelsOwnedContract } from './endpoints/channels/owned.contract.js';
import { channelsSearchContract } from './endpoints/channels/search.contract.js';
import { channelsShowContract } from './endpoints/channels/show.contract.js';
import { channelsTimelineContract } from './endpoints/channels/timeline.contract.js';
import { channelsUnfavoriteContract } from './endpoints/channels/unfavorite.contract.js';
import { channelsUnfollowContract } from './endpoints/channels/unfollow.contract.js';
import { channelsUpdateContract } from './endpoints/channels/update.contract.js';
import { channelsMuteCreateContract } from './endpoints/channels/mute/create.contract.js';
import { channelsMuteDeleteContract } from './endpoints/channels/mute/delete.contract.js';
import { channelsMuteListContract } from './endpoints/channels/mute/list.contract.js';

export const channelsApiContract = {
	channelsCreate: channelsCreateContract,
	channelsFavorite: channelsFavoriteContract,
	channelsFeatured: channelsFeaturedContract,
	channelsFollow: channelsFollowContract,
	channelsFollowed: channelsFollowedContract,
	channelsMyFavorites: channelsMyFavoritesContract,
	channelsOwned: channelsOwnedContract,
	channelsSearch: channelsSearchContract,
	channelsShow: channelsShowContract,
	channelsTimeline: channelsTimelineContract,
	channelsUnfavorite: channelsUnfavoriteContract,
	channelsUnfollow: channelsUnfollowContract,
	channelsUpdate: channelsUpdateContract,
	channelsMuteCreate: channelsMuteCreateContract,
	channelsMuteDelete: channelsMuteDeleteContract,
	channelsMuteList: channelsMuteListContract,
};
