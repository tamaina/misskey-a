/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type channelsFavoriteContract, channelsFavoriteErrors } from './endpoints/channels/favorite.contract.js';
import { type channelsFollowContract, channelsFollowErrors } from './endpoints/channels/follow.contract.js';
import { type channelsUnfavoriteContract, channelsUnfavoriteErrors } from './endpoints/channels/unfavorite.contract.js';
import { type channelsUnfollowContract, channelsUnfollowErrors } from './endpoints/channels/unfollow.contract.js';
import { type channelsMuteCreateContract, channelsMuteCreateErrors } from './endpoints/channels/mute/create.contract.js';
import { type channelsMuteDeleteContract, channelsMuteDeleteErrors } from './endpoints/channels/mute/delete.contract.js';
import type { ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import type * as v from 'valibot';

export interface ChannelCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

/** Semantic ports for channel interactions; the feature has no ORM or Nest dependency. */
export interface ChannelCommandsDependencies<Channel extends { id: string }, Actor extends { id: string }> {
	findById(channelId: string): Promise<Channel | null | undefined>;
	follow(actor: Actor, channel: Channel): Promise<unknown>;
	unfollow(actor: Actor, channel: Channel): Promise<unknown>;
	isAlreadyFollowingError(error: unknown): boolean;
	generateFavoriteId(): string;
	insertFavorite(favorite: { id: string; userId: string; channelId: string }): Promise<unknown>;
	deleteFavorite(userId: string, channelId: string): Promise<unknown>;
	isMuted(params: { requestUserId: string; targetChannelId: string }): Promise<boolean>;
	mute(params: { requestUserId: string; targetChannelId: string; expiresAt: Date | null }): Promise<unknown>;
	unmute(params: { requestUserId: string; targetChannelId: string }): Promise<unknown>;
	now(): number;
	createError(definition: ErrorDefinition): Error;
}

export function createChannelCommandOperations<Channel extends { id: string }, Actor extends { id: string }>(deps: ChannelCommandsDependencies<Channel, Actor>) {
	return {
		async channelsFavorite(input: v.InferOutput<NonNullable<typeof channelsFavoriteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsFavoriteErrors.noSuchChannel);

			await deps.insertFavorite({
				id: deps.generateFavoriteId(),
				userId: actor.id,
				channelId: channel.id,
			});
		},
		async channelsFollow(input: v.InferOutput<NonNullable<typeof channelsFollowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsFollowErrors.noSuchChannel);

			try {
				await deps.follow(actor, channel);
			} catch (error) {
				if (deps.isAlreadyFollowingError(error)) {
					throw deps.createError(channelsFollowErrors.alreadyFollowing);
				}
				throw error;
			}
		},
		async channelsUnfavorite(input: v.InferOutput<NonNullable<typeof channelsUnfavoriteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsUnfavoriteErrors.noSuchChannel);
			await deps.deleteFavorite(actor.id, channel.id);
		},
		async channelsUnfollow(input: v.InferOutput<NonNullable<typeof channelsUnfollowContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsUnfollowErrors.noSuchChannel);
			await deps.unfollow(actor, channel);
		},
		async channelsMuteCreate(input: v.InferOutput<NonNullable<typeof channelsMuteCreateContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsMuteCreateErrors.noSuchChannel);

			const isAlreadyMuted = await deps.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (isAlreadyMuted) throw deps.createError(channelsMuteCreateErrors.alreadyMuting);

			// Preserve the legacy truthy check: null, zero, and an omitted value create an indefinite mute.
			if (input.expiresAt && input.expiresAt <= deps.now()) {
				throw deps.createError(channelsMuteCreateErrors.expiresAtIsPast);
			}

			await deps.mute({
				requestUserId: actor.id,
				targetChannelId: channel.id,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
			});
		},
		async channelsMuteDelete(input: v.InferOutput<NonNullable<typeof channelsMuteDeleteContract['~orpc']['inputSchema']>>, actor: Actor): Promise<void> {
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelsMuteDeleteErrors.noSuchChannel);

			const isMuted = await deps.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (!isMuted) throw deps.createError(channelsMuteDeleteErrors.notMuting);

			await deps.unmute({ requestUserId: actor.id, targetChannelId: channel.id });
		},
	};
}

export type ChannelCommandOperations<Channel extends { id: string }, Actor extends { id: string }> = ReturnType<typeof createChannelCommandOperations<Channel, Actor>>;
export const createChannelCommands = createChannelCommandOperations;
export type ChannelCommandsFeature<Channel extends { id: string }, Actor extends { id: string }> = ChannelCommandOperations<Channel, Actor>;
