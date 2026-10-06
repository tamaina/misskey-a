/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { toLegacyJsonSchema, featureProcedure } from '../../api/backend/index.js';
import { relationshipContract, relationshipErrors, relationshipInputs } from '../contract/commands.js';
import type { RelationshipEndpoints } from '../contract/commands.js';

export interface RelationshipCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

/** Small persistence/service ports used by the selected relationship commands. */
export interface RelationshipCommandsDependencies<
	User extends { id: string },
	Actor extends { id: string },
	Muting extends { id: string },
	RenoteMuting extends { id: string },
> {
	getUser(userId: string): Promise<User>;
	isMissingUserError(error: unknown): boolean;
	acceptFollowRequest(actor: Actor, follower: User): Promise<unknown>;
	rejectFollowRequest(actor: Actor, follower: User): Promise<unknown>;
	isMissingFollowRequestError(error: unknown): boolean;
	findMuting(muterId: string, muteeId: string): Promise<Muting | null | undefined>;
	unmute(mutings: Muting[]): Promise<unknown>;
	isRenoteMuting(muterId: string, muteeId: string): Promise<boolean>;
	muteRenotes(actor: Actor, target: User): Promise<unknown>;
	findRenoteMuting(muterId: string, muteeId: string): Promise<RenoteMuting | null | undefined>;
	unmuteRenotes(mutings: RenoteMuting[]): Promise<unknown>;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor<Actor extends { id: string }>(context: RelationshipCommandsContext<Actor> | null | undefined): Actor {
	const actor = context?.actor;
	if (actor == null || typeof actor.id !== 'string' || actor.id.length === 0) {
		throw new Error('An authenticated actor is required for relationship commands.');
	}
	return actor;
}

async function getUserOrThrow<User extends { id: string }, Actor extends { id: string }, Muting extends { id: string }, RenoteMuting extends { id: string }>(
	deps: RelationshipCommandsDependencies<User, Actor, Muting, RenoteMuting>,
	userId: string,
	definition: ApiErrorDefinition,
): Promise<User> {
	try {
		return await deps.getUser(userId);
	} catch (error) {
		if (deps.isMissingUserError(error)) throw deps.createError(definition);
		throw error;
	}
}

/** Relationship command handlers with their legacy lookup, error and await ordering preserved. */
export function createRelationshipCommands<
	User extends { id: string },
	Actor extends { id: string },
	Muting extends { id: string },
	RenoteMuting extends { id: string },
>(deps: RelationshipCommandsDependencies<User, Actor, Muting, RenoteMuting>) {
	const bind = featureProcedure<RelationshipCommandsContext<Actor>>();

	const acceptRequest = bind(relationshipContract['following/requests/accept'], async ({ input, context }) => {
		const actor = requireActor(context);
		// Fetch follower, then map only the legacy missing-user error.
		const follower = await getUserOrThrow(deps, input.userId, relationshipErrors['following/requests/accept'].noSuchUser);
		try {
			await deps.acceptFollowRequest(actor, follower);
		} catch (error) {
			if (deps.isMissingFollowRequestError(error)) {
				throw deps.createError(relationshipErrors['following/requests/accept'].noFollowRequest);
			}
			throw error;
		}
	});

	const rejectRequest = bind(relationshipContract['following/requests/reject'], async ({ input, context }) => {
		const actor = requireActor(context);
		const follower = await getUserOrThrow(deps, input.userId, relationshipErrors['following/requests/reject'].noSuchUser);
		await deps.rejectFollowRequest(actor, follower);
	});

	const deleteMute = bind(relationshipContract['mute/delete'], async ({ input, context }) => {
		const actor = requireActor(context);
		// Preserve the self check before the user lookup.
		if (actor.id === input.userId) throw deps.createError(relationshipErrors['mute/delete'].muteeIsYourself);

		const mutee = await getUserOrThrow(deps, input.userId, relationshipErrors['mute/delete'].noSuchUser);
		const existing = await deps.findMuting(actor.id, mutee.id);
		if (existing == null) throw deps.createError(relationshipErrors['mute/delete'].notMuting);
		await deps.unmute([existing]);
	});

	const createRenoteMute = bind(relationshipContract['renote-mute/create'], async ({ input, context }) => {
		const actor = requireActor(context);
		if (actor.id === input.userId) throw deps.createError(relationshipErrors['renote-mute/create'].muteeIsYourself);

		const mutee = await getUserOrThrow(deps, input.userId, relationshipErrors['renote-mute/create'].noSuchUser);
		if (await deps.isRenoteMuting(actor.id, mutee.id)) {
			throw deps.createError(relationshipErrors['renote-mute/create'].alreadyMuting);
		}
		await deps.muteRenotes(actor, mutee);
	});

	const deleteRenoteMute = bind(relationshipContract['renote-mute/delete'], async ({ input, context }) => {
		const actor = requireActor(context);
		if (actor.id === input.userId) throw deps.createError(relationshipErrors['renote-mute/delete'].muteeIsYourself);

		const mutee = await getUserOrThrow(deps, input.userId, relationshipErrors['renote-mute/delete'].noSuchUser);
		const existing = await deps.findRenoteMuting(actor.id, mutee.id);
		if (existing == null) throw deps.createError(relationshipErrors['renote-mute/delete'].notMuting);
		await deps.unmuteRenotes([existing]);
	});

	return {
		'following/requests/accept': acceptRequest,
		'following/requests/reject': rejectRequest,
		'mute/delete': deleteMute,
		'renote-mute/create': createRenoteMute,
		'renote-mute/delete': deleteRenoteMute,
	} satisfies { [K in keyof RelationshipEndpoints]: unknown };
}

export type RelationshipCommandsFeature<
	User extends { id: string },
	Actor extends { id: string },
	Muting extends { id: string },
	RenoteMuting extends { id: string },
> = ReturnType<typeof createRelationshipCommands<User, Actor, Muting, RenoteMuting>>;

export const legacyRelationshipSchemas: Record<keyof typeof relationshipInputs, { input: JsonSchema }> = {
	'following/requests/accept': { input: toLegacyJsonSchema(relationshipInputs['following/requests/accept']) },
	'following/requests/reject': { input: toLegacyJsonSchema(relationshipInputs['following/requests/reject']) },
	'mute/delete': { input: toLegacyJsonSchema(relationshipInputs['mute/delete']) },
	'renote-mute/create': { input: toLegacyJsonSchema(relationshipInputs['renote-mute/create']) },
	'renote-mute/delete': { input: toLegacyJsonSchema(relationshipInputs['renote-mute/delete']) },
};
