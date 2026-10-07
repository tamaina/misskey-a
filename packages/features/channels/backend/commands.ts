/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { channelContract, channelErrors, channelInputs } from '../contract/index.js';
import type { ChannelEndpoints } from '../contract/index.js';

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
	createError(definition: ApiErrorDefinition): Error;
}

function requireChannelActor<Actor extends { id: string }>(context: ChannelCommandsContext<Actor> | null | undefined): Actor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted actor is required for channel commands.');
	}

	return context.actor;
}

/** Build the six channel interaction commands while preserving their legacy order and error mapping. */
export function createChannelCommands<Channel extends { id: string }, Actor extends { id: string }>(deps: ChannelCommandsDependencies<Channel, Actor>) {
	const clientContext = (context: ChannelCommandsContext<Actor>) => context;

	const follow = createProcedureClient(implement(channelContract['channels/follow'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/follow'].noSuchChannel);

			try {
				await deps.follow(actor, channel);
			} catch (error) {
				if (deps.isAlreadyFollowingError(error)) {
					throw deps.createError(channelErrors['channels/follow'].alreadyFollowing);
				}
				throw error;
			}
		}), { context: clientContext });

	const unfollow = createProcedureClient(implement(channelContract['channels/unfollow'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/unfollow'].noSuchChannel);
			await deps.unfollow(actor, channel);
		}), { context: clientContext });

	const favorite = createProcedureClient(implement(channelContract['channels/favorite'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/favorite'].noSuchChannel);

			await deps.insertFavorite({
				id: deps.generateFavoriteId(),
				userId: actor.id,
				channelId: channel.id,
			});
		}), { context: clientContext });

	const unfavorite = createProcedureClient(implement(channelContract['channels/unfavorite'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/unfavorite'].noSuchChannel);
			await deps.deleteFavorite(actor.id, channel.id);
		}), { context: clientContext });

	const muteCreate = createProcedureClient(implement(channelContract['channels/mute/create'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/mute/create'].noSuchChannel);

			const isAlreadyMuted = await deps.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (isAlreadyMuted) throw deps.createError(channelErrors['channels/mute/create'].alreadyMuting);

			// Preserve the legacy truthy check: null, zero, and an omitted value create an indefinite mute.
			if (input.expiresAt && input.expiresAt <= deps.now()) {
				throw deps.createError(channelErrors['channels/mute/create'].expiresAtIsPast);
			}

			await deps.mute({
				requestUserId: actor.id,
				targetChannelId: channel.id,
				expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
			});
		}), { context: clientContext });

	const muteDelete = createProcedureClient(implement(channelContract['channels/mute/delete'])
		.$context<ChannelCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireChannelActor(context);
			const channel = await deps.findById(input.channelId);
			if (channel == null) throw deps.createError(channelErrors['channels/mute/delete'].noSuchChannel);

			const isMuted = await deps.isMuted({ requestUserId: actor.id, targetChannelId: channel.id });
			if (!isMuted) throw deps.createError(channelErrors['channels/mute/delete'].notMuting);

			await deps.unmute({ requestUserId: actor.id, targetChannelId: channel.id });
		}), { context: clientContext });

	return {
		'channels/follow': follow,
		'channels/unfollow': unfollow,
		'channels/favorite': favorite,
		'channels/unfavorite': unfavorite,
		'channels/mute/create': muteCreate,
		'channels/mute/delete': muteDelete,
	} satisfies { [K in keyof ChannelEndpoints]: unknown };
}

export type ChannelCommandsFeature<Channel extends { id: string }, Actor extends { id: string }> = ReturnType<typeof createChannelCommands<Channel, Actor>>;

export const legacyChannelSchemas: Record<keyof typeof channelInputs, { input: JsonSchema }> = {
	'channels/follow': { input: toLegacyJsonSchema(channelInputs['channels/follow'], { target: 'openapi-3.0' }) },
	'channels/unfollow': { input: toLegacyJsonSchema(channelInputs['channels/unfollow'], { target: 'openapi-3.0' }) },
	'channels/favorite': { input: toLegacyJsonSchema(channelInputs['channels/favorite'], { target: 'openapi-3.0' }) },
	'channels/unfavorite': { input: toLegacyJsonSchema(channelInputs['channels/unfavorite'], { target: 'openapi-3.0' }) },
	'channels/mute/create': { input: toLegacyJsonSchema(channelInputs['channels/mute/create'], { target: 'openapi-3.0' }) },
	'channels/mute/delete': { input: toLegacyJsonSchema(channelInputs['channels/mute/delete'], { target: 'openapi-3.0' }) },
};
