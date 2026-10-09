/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { ChannelCommandOperations } from './commands.js';
import type { MiChannel } from './models/Channel.js';
import { channelsCreateInput, channelsCreateOutput } from './endpoints/channels/create.contract.js';
import { channelsFavoriteInput, channelsFavoriteOutput } from './endpoints/channels/favorite.contract.js';
import { channelsFeaturedInput, channelsFeaturedOutput } from './endpoints/channels/featured.contract.js';
import { channelsFollowInput, channelsFollowOutput } from './endpoints/channels/follow.contract.js';
import { channelsFollowedInput, channelsFollowedOutput } from './endpoints/channels/followed.contract.js';
import { channelsMyFavoritesInput, channelsMyFavoritesOutput } from './endpoints/channels/my-favorites.contract.js';
import { channelsOwnedInput, channelsOwnedOutput } from './endpoints/channels/owned.contract.js';
import { channelsSearchInput, channelsSearchOutput } from './endpoints/channels/search.contract.js';
import { channelsShowInput, channelsShowOutput } from './endpoints/channels/show.contract.js';
import { channelsTimelineInput, channelsTimelineOutput } from './endpoints/channels/timeline.contract.js';
import { channelsUnfavoriteInput, channelsUnfavoriteOutput } from './endpoints/channels/unfavorite.contract.js';
import { channelsUnfollowInput, channelsUnfollowOutput } from './endpoints/channels/unfollow.contract.js';
import { channelsUpdateInput, channelsUpdateOutput } from './endpoints/channels/update.contract.js';
import { channelsMuteCreateInput, channelsMuteCreateOutput } from './endpoints/channels/mute/create.contract.js';
import { channelsMuteDeleteInput, channelsMuteDeleteOutput } from './endpoints/channels/mute/delete.contract.js';
import { channelsMuteListInput, channelsMuteListOutput } from './endpoints/channels/mute/list.contract.js';
import { ChannelsCreateOperation } from './endpoints/channels/create.js';
import { ChannelsFeaturedOperation } from './endpoints/channels/featured.js';
import { ChannelsFollowedOperation } from './endpoints/channels/followed.js';
import { ChannelsMyFavoritesOperation } from './endpoints/channels/my-favorites.js';
import { ChannelsOwnedOperation } from './endpoints/channels/owned.js';
import { ChannelsSearchOperation } from './endpoints/channels/search.js';
import { ChannelsShowOperation } from './endpoints/channels/show.js';
import { ChannelsTimelineOperation } from './endpoints/channels/timeline.js';
import { ChannelsUpdateOperation } from './endpoints/channels/update.js';
import { ChannelsMuteListOperation } from './endpoints/channels/mute/list.js';

export interface ChannelsOperations<Actor extends ApiActor> {
	channelsCreate(input: v.InferOutput<typeof channelsCreateInput>, actor: Actor): Promise<v.InferOutput<typeof channelsCreateOutput>>;
	channelsFavorite(input: v.InferOutput<typeof channelsFavoriteInput>, actor: Actor): Promise<v.InferOutput<typeof channelsFavoriteOutput>>;
	channelsFeatured(input: v.InferOutput<typeof channelsFeaturedInput>, actor: Actor | null): Promise<v.InferOutput<typeof channelsFeaturedOutput>>;
	channelsFollow(input: v.InferOutput<typeof channelsFollowInput>, actor: Actor): Promise<v.InferOutput<typeof channelsFollowOutput>>;
	channelsFollowed(input: v.InferOutput<typeof channelsFollowedInput>, actor: Actor): Promise<v.InferOutput<typeof channelsFollowedOutput>>;
	channelsMyFavorites(input: v.InferOutput<typeof channelsMyFavoritesInput>, actor: Actor): Promise<v.InferOutput<typeof channelsMyFavoritesOutput>>;
	channelsOwned(input: v.InferOutput<typeof channelsOwnedInput>, actor: Actor): Promise<v.InferOutput<typeof channelsOwnedOutput>>;
	channelsSearch(input: v.InferOutput<typeof channelsSearchInput>, actor: Actor | null): Promise<v.InferOutput<typeof channelsSearchOutput>>;
	channelsShow(input: v.InferOutput<typeof channelsShowInput>, actor: Actor | null): Promise<v.InferOutput<typeof channelsShowOutput>>;
	channelsTimeline(input: v.InferOutput<typeof channelsTimelineInput>, actor: Actor | null): Promise<v.InferOutput<typeof channelsTimelineOutput>>;
	channelsUnfavorite(input: v.InferOutput<typeof channelsUnfavoriteInput>, actor: Actor): Promise<v.InferOutput<typeof channelsUnfavoriteOutput>>;
	channelsUnfollow(input: v.InferOutput<typeof channelsUnfollowInput>, actor: Actor): Promise<v.InferOutput<typeof channelsUnfollowOutput>>;
	channelsUpdate(input: v.InferOutput<typeof channelsUpdateInput>, actor: Actor): Promise<v.InferOutput<typeof channelsUpdateOutput>>;
	channelsMuteCreate(input: v.InferOutput<typeof channelsMuteCreateInput>, actor: Actor): Promise<v.InferOutput<typeof channelsMuteCreateOutput>>;
	channelsMuteDelete(input: v.InferOutput<typeof channelsMuteDeleteInput>, actor: Actor): Promise<v.InferOutput<typeof channelsMuteDeleteOutput>>;
	channelsMuteList(input: v.InferOutput<typeof channelsMuteListInput>, actor: Actor): Promise<v.InferOutput<typeof channelsMuteListOutput>>;
}

export type ChannelsApiContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { channels: ChannelsOperations<Actor> } };

export const channelOperationProviders = [
	ChannelsCreateOperation,
	ChannelsFeaturedOperation,
	ChannelsFollowedOperation,
	ChannelsMyFavoritesOperation,
	ChannelsOwnedOperation,
	ChannelsSearchOperation,
	ChannelsShowOperation,
	ChannelsTimelineOperation,
	ChannelsUpdateOperation,
	ChannelsMuteListOperation,
];

export interface ChannelsOperationDependencies {
	channelsCreate: Pick<ChannelsCreateOperation, 'execute'>;
	channelsFeatured: Pick<ChannelsFeaturedOperation, 'execute'>;
	channelsFollowed: Pick<ChannelsFollowedOperation, 'execute'>;
	channelsMyFavorites: Pick<ChannelsMyFavoritesOperation, 'execute'>;
	channelsOwned: Pick<ChannelsOwnedOperation, 'execute'>;
	channelsSearch: Pick<ChannelsSearchOperation, 'execute'>;
	channelsShow: Pick<ChannelsShowOperation, 'execute'>;
	channelsTimeline: Pick<ChannelsTimelineOperation, 'execute'>;
	channelsUpdate: Pick<ChannelsUpdateOperation, 'execute'>;
	channelsMuteList: Pick<ChannelsMuteListOperation, 'execute'>;
	commands: ChannelCommandOperations<MiChannel, MiLocalUser>;
}

export function createChannelsOperations(deps: ChannelsOperationDependencies): ChannelsOperations<MiLocalUser> {
	return {
		channelsCreate: (input, actor) => deps.channelsCreate.execute(input, actor),
		channelsFavorite: (input, actor) => deps.commands.channelsFavorite(input, actor),
		channelsFeatured: (input, actor) => deps.channelsFeatured.execute(input, actor),
		channelsFollow: (input, actor) => deps.commands.channelsFollow(input, actor),
		channelsFollowed: (input, actor) => deps.channelsFollowed.execute(input, actor),
		channelsMyFavorites: (input, actor) => deps.channelsMyFavorites.execute(input, actor),
		channelsOwned: (input, actor) => deps.channelsOwned.execute(input, actor),
		channelsSearch: (input, actor) => deps.channelsSearch.execute(input, actor),
		channelsShow: (input, actor) => deps.channelsShow.execute(input, actor),
		channelsTimeline: (input, actor) => deps.channelsTimeline.execute(input, actor),
		channelsUnfavorite: (input, actor) => deps.commands.channelsUnfavorite(input, actor),
		channelsUnfollow: (input, actor) => deps.commands.channelsUnfollow(input, actor),
		channelsUpdate: (input, actor) => deps.channelsUpdate.execute(input, actor),
		channelsMuteCreate: (input, actor) => deps.commands.channelsMuteCreate(input, actor),
		channelsMuteDelete: (input, actor) => deps.commands.channelsMuteDelete(input, actor),
		channelsMuteList: (input, actor) => deps.channelsMuteList.execute(input, actor),
	};
}
