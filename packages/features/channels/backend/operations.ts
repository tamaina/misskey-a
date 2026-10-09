/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { ChannelCommandOperations } from './commands.js';
import type { MiChannel } from './models/Channel.js';
import type { channelsCreateContract } from './endpoints/channels/create.contract.js';
import type { channelsFavoriteContract } from './endpoints/channels/favorite.contract.js';
import type { channelsFeaturedContract } from './endpoints/channels/featured.contract.js';
import type { channelsFollowContract } from './endpoints/channels/follow.contract.js';
import type { channelsFollowedContract } from './endpoints/channels/followed.contract.js';
import type { channelsMyFavoritesContract } from './endpoints/channels/my-favorites.contract.js';
import type { channelsOwnedContract } from './endpoints/channels/owned.contract.js';
import type { channelsSearchContract } from './endpoints/channels/search.contract.js';
import type { channelsShowContract } from './endpoints/channels/show.contract.js';
import type { channelsTimelineContract } from './endpoints/channels/timeline.contract.js';
import type { channelsUnfavoriteContract } from './endpoints/channels/unfavorite.contract.js';
import type { channelsUnfollowContract } from './endpoints/channels/unfollow.contract.js';
import type { channelsUpdateContract } from './endpoints/channels/update.contract.js';
import type { channelsMuteCreateContract } from './endpoints/channels/mute/create.contract.js';
import type { channelsMuteDeleteContract } from './endpoints/channels/mute/delete.contract.js';
import type { channelsMuteListContract } from './endpoints/channels/mute/list.contract.js';
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
	channelsCreate(input: v.InferOutput<NonNullable<typeof channelsCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsCreateContract['~orpc']['outputSchema']>>>;
	channelsFavorite(input: v.InferOutput<NonNullable<typeof channelsFavoriteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsFavoriteContract['~orpc']['outputSchema']>>>;
	channelsFeatured(input: v.InferOutput<NonNullable<typeof channelsFeaturedContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof channelsFeaturedContract['~orpc']['outputSchema']>>>;
	channelsFollow(input: v.InferOutput<NonNullable<typeof channelsFollowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsFollowContract['~orpc']['outputSchema']>>>;
	channelsFollowed(input: v.InferOutput<NonNullable<typeof channelsFollowedContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsFollowedContract['~orpc']['outputSchema']>>>;
	channelsMyFavorites(input: v.InferOutput<NonNullable<typeof channelsMyFavoritesContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsMyFavoritesContract['~orpc']['outputSchema']>>>;
	channelsOwned(input: v.InferOutput<NonNullable<typeof channelsOwnedContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsOwnedContract['~orpc']['outputSchema']>>>;
	channelsSearch(input: v.InferOutput<NonNullable<typeof channelsSearchContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof channelsSearchContract['~orpc']['outputSchema']>>>;
	channelsShow(input: v.InferOutput<NonNullable<typeof channelsShowContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof channelsShowContract['~orpc']['outputSchema']>>>;
	channelsTimeline(input: v.InferOutput<NonNullable<typeof channelsTimelineContract['~orpc']['inputSchema']>>, actor: Actor | null): Promise<v.InferOutput<NonNullable<typeof channelsTimelineContract['~orpc']['outputSchema']>>>;
	channelsUnfavorite(input: v.InferOutput<NonNullable<typeof channelsUnfavoriteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsUnfavoriteContract['~orpc']['outputSchema']>>>;
	channelsUnfollow(input: v.InferOutput<NonNullable<typeof channelsUnfollowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsUnfollowContract['~orpc']['outputSchema']>>>;
	channelsUpdate(input: v.InferOutput<NonNullable<typeof channelsUpdateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsUpdateContract['~orpc']['outputSchema']>>>;
	channelsMuteCreate(input: v.InferOutput<NonNullable<typeof channelsMuteCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsMuteCreateContract['~orpc']['outputSchema']>>>;
	channelsMuteDelete(input: v.InferOutput<NonNullable<typeof channelsMuteDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsMuteDeleteContract['~orpc']['outputSchema']>>>;
	channelsMuteList(input: v.InferOutput<NonNullable<typeof channelsMuteListContract['~orpc']['inputSchema']>>, actor: Actor): Promise<v.InferOutput<NonNullable<typeof channelsMuteListContract['~orpc']['outputSchema']>>>;
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
