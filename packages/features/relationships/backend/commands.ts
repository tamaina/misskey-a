/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { listContract, listErrors, listInputs } from '../contract/lists.js';
import type { ListEndpoints } from '../contract/lists.js';

export interface ListCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

/** Semantic ports for user-list commands; the feature has no ORM or Nest dependency. */
export interface ListCommandsDependencies<
	List extends { id: string },
	User extends { id: string },
	Actor extends { id: string },
	Favorite extends { id: string },
> {
	findOwnedList(listId: string, ownerId: string): Promise<List | null | undefined>;
	deleteList(listId: string): Promise<unknown>;
	findPublicList(listId: string): Promise<boolean>;
	hasFavorite(userId: string, listId: string): Promise<boolean>;
	generateFavoriteId(): string;
	insertFavorite(favorite: { id: string; userId: string; userListId: string }): Promise<unknown>;
	findFavorite(listId: string, userId: string): Promise<Favorite | null>;
	deleteFavorite(favoriteId: string): Promise<unknown>;
	getUser(userId: string): Promise<User>;
	isMissingUserError(error: unknown): boolean;
	removeMember(user: User, list: List): Promise<unknown>;
	hasReverseBlock(blockerId: string, blockeeId: string): Promise<boolean>;
	hasMembership(listId: string, userId: string): Promise<boolean>;
	addMember(user: User, list: List, actor: Actor): Promise<unknown>;
	isTooManyUsersError(error: unknown): boolean;
	updateMembership(user: User, list: List, options: { withReplies: boolean | undefined }): Promise<unknown>;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor<Actor extends { id: string }>(context: ListCommandsContext<Actor> | null | undefined): Actor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted actor is required for user-list commands.');
	}

	return context.actor;
}

async function getUserOrThrow<List extends { id: string }, User extends { id: string }, Actor extends { id: string }, Favorite extends { id: string }>(
	deps: ListCommandsDependencies<List, User, Actor, Favorite>,
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

/** Build the six list commands while keeping their legacy ordering and error mapping. */
export function createListCommands<
	List extends { id: string },
	User extends { id: string },
	Actor extends { id: string },
	Favorite extends { id: string },
>(deps: ListCommandsDependencies<List, User, Actor, Favorite>) {
	const clientContext = (context: ListCommandsContext<Actor>) => context;

	const deleteList = createProcedureClient(implement(listContract['users/lists/delete'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const list = await deps.findOwnedList(input.listId, actor.id);
			if (list == null) throw deps.createError(listErrors['users/lists/delete'].noSuchList);
			await deps.deleteList(list.id);
		}), { context: clientContext });

	const favoriteList = createProcedureClient(implement(listContract['users/lists/favorite'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			if (!await deps.findPublicList(input.listId)) {
				throw deps.createError(listErrors['users/lists/favorite'].noSuchList);
			}

			if (await deps.hasFavorite(actor.id, input.listId)) {
				throw deps.createError(listErrors['users/lists/favorite'].alreadyFavorited);
			}

			await deps.insertFavorite({
				id: deps.generateFavoriteId(),
				userId: actor.id,
				userListId: input.listId,
			});
		}), { context: clientContext });

	const pull = createProcedureClient(implement(listContract['users/lists/pull'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const list = await deps.findOwnedList(input.listId, actor.id);
			if (list == null) throw deps.createError(listErrors['users/lists/pull'].noSuchList);

			const user = await getUserOrThrow(deps, input.userId, listErrors['users/lists/pull'].noSuchUser);
			await deps.removeMember(user, list);
		}), { context: clientContext });

	const push = createProcedureClient(implement(listContract['users/lists/push'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const list = await deps.findOwnedList(input.listId, actor.id);
			if (list == null) throw deps.createError(listErrors['users/lists/push'].noSuchList);

			const user = await getUserOrThrow(deps, input.userId, listErrors['users/lists/push'].noSuchUser);

			if (user.id !== actor.id && await deps.hasReverseBlock(user.id, actor.id)) {
				throw deps.createError(listErrors['users/lists/push'].youHaveBeenBlocked);
			}

			if (await deps.hasMembership(list.id, user.id)) {
				throw deps.createError(listErrors['users/lists/push'].alreadyAdded);
			}

			try {
				await deps.addMember(user, list, actor);
			} catch (error) {
				if (deps.isTooManyUsersError(error)) {
					throw deps.createError(listErrors['users/lists/push'].tooManyUsers);
				}
				throw error;
			}
		}), { context: clientContext });

	const unfavoriteList = createProcedureClient(implement(listContract['users/lists/unfavorite'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			if (!await deps.findPublicList(input.listId)) {
				throw deps.createError(listErrors['users/lists/unfavorite'].noSuchList);
			}

			const favorite = await deps.findFavorite(input.listId, actor.id);
			// Deliberately preserve the old null-only check (an undefined result reaches favorite.id).
			if (favorite === null) throw deps.createError(listErrors['users/lists/unfavorite'].notFavorited);
			await deps.deleteFavorite(favorite.id);
		}), { context: clientContext });

	const updateMembership = createProcedureClient(implement(listContract['users/lists/update-membership'])
		.$context<ListCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const list = await deps.findOwnedList(input.listId, actor.id);
			if (list == null) throw deps.createError(listErrors['users/lists/update-membership'].noSuchList);

			const user = await getUserOrThrow(deps, input.userId, listErrors['users/lists/update-membership'].noSuchUser);
			await deps.updateMembership(user, list, { withReplies: input.withReplies });
		}), { context: clientContext });

	return {
		'users/lists/delete': deleteList,
		'users/lists/favorite': favoriteList,
		'users/lists/pull': pull,
		'users/lists/push': push,
		'users/lists/unfavorite': unfavoriteList,
		'users/lists/update-membership': updateMembership,
	} satisfies { [K in keyof ListEndpoints]: unknown };
}

export type ListCommandsFeature<
	List extends { id: string },
	User extends { id: string },
	Actor extends { id: string },
	Favorite extends { id: string },
> = ReturnType<typeof createListCommands<List, User, Actor, Favorite>>;

export const legacyListSchemas: Record<keyof typeof listInputs, { input: JsonSchema }> = {
	'users/lists/delete': { input: toLegacyJsonSchema(listInputs['users/lists/delete']) },
	'users/lists/favorite': { input: toLegacyJsonSchema(listInputs['users/lists/favorite']) },
	'users/lists/pull': { input: toLegacyJsonSchema(listInputs['users/lists/pull']) },
	'users/lists/push': { input: toLegacyJsonSchema(listInputs['users/lists/push']) },
	'users/lists/unfavorite': { input: toLegacyJsonSchema(listInputs['users/lists/unfavorite']) },
	'users/lists/update-membership': { input: toLegacyJsonSchema(listInputs['users/lists/update-membership']) },
};
