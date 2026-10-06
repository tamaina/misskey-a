/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '../../api/contract/index.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';
import { clipFavoriteContract, clipFavoriteErrors, clipFavoriteInputs, type CollectionEndpoints } from '../contract/index.js';

export interface ClipFavoriteContext {
	actor: { id: string };
}

export interface ClipFavoriteDependencies<Clip extends { id: string; userId: string; isPublic: boolean }, Favorite extends { id: string }> {
	findClipById(id: string): Promise<Clip | null | undefined>;
	hasFavorite(clipId: string, userId: string): Promise<boolean>;
	generateFavoriteId(): string;
	insertFavorite(values: { id: string; clipId: string; userId: string }): Promise<unknown>;
	findFavorite(clipId: string, userId: string): Promise<Favorite | null | undefined>;
	deleteFavorite(id: string): Promise<unknown>;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor(context: ClipFavoriteContext | null | undefined): { id: string } {
	const id = context?.actor?.id;
	if (typeof id !== 'string' || id.length === 0) {
		throw new Error('An authenticated actor is required for clip favorite commands.');
	}
	return { id };
}

/** Build clip favorite commands from narrow persistence ports, independent of ClipService. */
export function createClipFavoriteCommands<Clip extends { id: string; userId: string; isPublic: boolean }, Favorite extends { id: string }>(deps: ClipFavoriteDependencies<Clip, Favorite>) {
	const clientContext = (context: ClipFavoriteContext) => context;

	const favorite = createProcedureClient(implement(clipFavoriteContract['clips/favorite'])
		.$context<ClipFavoriteContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const clip = await deps.findClipById(input.clipId);
			if (clip == null || (clip.userId !== actor.id && !clip.isPublic)) {
				throw deps.createError(clipFavoriteErrors['clips/favorite'].noSuchClip);
			}

			if (await deps.hasFavorite(clip.id, actor.id)) {
				throw deps.createError(clipFavoriteErrors['clips/favorite'].alreadyFavorited);
			}

			await deps.insertFavorite({
				id: deps.generateFavoriteId(),
				clipId: clip.id,
				userId: actor.id,
			});
		}), { context: clientContext });

	const unfavorite = createProcedureClient(implement(clipFavoriteContract['clips/unfavorite'])
		.$context<ClipFavoriteContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			const clip = await deps.findClipById(input.clipId);
			if (clip == null) {
				throw deps.createError(clipFavoriteErrors['clips/unfavorite'].noSuchClip);
			}

			const favorite = await deps.findFavorite(clip.id, actor.id);
			if (favorite == null) {
				throw deps.createError(clipFavoriteErrors['clips/unfavorite'].notFavorited);
			}

			await deps.deleteFavorite(favorite.id);
		}), { context: clientContext });

	return {
		'clips/favorite': favorite,
		'clips/unfavorite': unfavorite,
	} satisfies Pick<{ [K in keyof CollectionEndpoints]: unknown }, 'clips/favorite' | 'clips/unfavorite'>;
}

export type ClipFavoriteCommandsFeature<Clip extends { id: string; userId: string; isPublic: boolean }, Favorite extends { id: string }> = ReturnType<typeof createClipFavoriteCommands<Clip, Favorite>>;

export const legacyClipFavoriteSchemas: Record<keyof typeof clipFavoriteInputs, { input: JsonSchema }> = {
	'clips/favorite': { input: toLegacyJsonSchema(clipFavoriteInputs['clips/favorite']) },
	'clips/unfavorite': { input: toLegacyJsonSchema(clipFavoriteInputs['clips/unfavorite']) },
};
