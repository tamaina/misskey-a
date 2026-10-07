/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { collectionsContract, collectionsErrors, collectionsInputs } from '../contract/index.js';
export { collectionsErrors } from '../contract/index.js';
export { clipFavoriteErrors } from '../contract/index.js';
import type { CollectionEndpoints } from '../contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';

export interface CollectionsActor {
	id: string;
}

export interface CollectionsContext {
	actor: CollectionsActor;
}

export type CollectionsError = 'noSuchClip' | 'noSuchNote' | 'alreadyAdded' | 'tooManyClipNotes';

export interface CollectionsDependencies {
	delete(actor: CollectionsActor, clipId: string): Promise<unknown>;
	addNote(actor: CollectionsActor, clipId: string, noteId: string): Promise<unknown>;
	removeNote(actor: CollectionsActor, clipId: string, noteId: string): Promise<unknown>;
	classifyError(error: unknown): CollectionsError | undefined;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor(context: CollectionsContext | null | undefined): CollectionsActor {
	const id = context?.actor?.id;
	if (typeof id !== 'string' || id.length === 0) {
		throw new Error('An authenticated actor is required for clip commands.');
	}
	return { id };
}

function routeError(deps: CollectionsDependencies, error: unknown, route: keyof typeof collectionsErrors): unknown {
	const classification = deps.classifyError(error);
	switch (route) {
		case 'clips/delete':
			if (classification === 'noSuchClip') return deps.createError(collectionsErrors['clips/delete'].noSuchClip);
			break;
		case 'clips/add-note':
			if (classification === 'noSuchClip') return deps.createError(collectionsErrors['clips/add-note'].noSuchClip);
			if (classification === 'noSuchNote') return deps.createError(collectionsErrors['clips/add-note'].noSuchNote);
			if (classification === 'alreadyAdded') return deps.createError(collectionsErrors['clips/add-note'].alreadyClipped);
			if (classification === 'tooManyClipNotes') return deps.createError(collectionsErrors['clips/add-note'].tooManyClipNotes);
			break;
		case 'clips/remove-note':
			if (classification === 'noSuchClip') return deps.createError(collectionsErrors['clips/remove-note'].noSuchClip);
			if (classification === 'noSuchNote') return deps.createError(collectionsErrors['clips/remove-note'].noSuchNote);
			break;
	}
	return error;
}

export function createCollectionCommands(deps: CollectionsDependencies) {
	const clientContext = (context: CollectionsContext) => context;

	const deleteClip = createProcedureClient(implement(collectionsContract['clips/delete'])
		.$context<CollectionsContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			try {
				await deps.delete(actor, input.clipId);
			} catch (error) {
				throw routeError(deps, error, 'clips/delete');
			}
		}), { context: clientContext });

	const addNote = createProcedureClient(implement(collectionsContract['clips/add-note'])
		.$context<CollectionsContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			try {
				await deps.addNote(actor, input.clipId, input.noteId);
			} catch (error) {
				throw routeError(deps, error, 'clips/add-note');
			}
		}), { context: clientContext });

	const removeNote = createProcedureClient(implement(collectionsContract['clips/remove-note'])
		.$context<CollectionsContext>()
		.handler(async ({ input, context }) => {
			const actor = requireActor(context);
			try {
				await deps.removeNote(actor, input.clipId, input.noteId);
			} catch (error) {
				throw routeError(deps, error, 'clips/remove-note');
			}
		}), { context: clientContext });

	return {
		'clips/delete': deleteClip,
		'clips/add-note': addNote,
		'clips/remove-note': removeNote,
	} satisfies Pick<{ [K in keyof CollectionEndpoints]: unknown }, 'clips/delete' | 'clips/add-note' | 'clips/remove-note'>;
}

export type CollectionCommandsFeature = ReturnType<typeof createCollectionCommands>;

export const legacyCollectionsSchemas: Record<keyof typeof collectionsInputs, { input: JsonSchema }> = {
	'clips/delete': { input: toLegacyJsonSchema(collectionsInputs['clips/delete']) },
	'clips/add-note': { input: toLegacyJsonSchema(collectionsInputs['clips/add-note']) },
	'clips/remove-note': { input: toLegacyJsonSchema(collectionsInputs['clips/remove-note']) },
};

export { createClipFavoriteCommands, legacyClipFavoriteSchemas } from './clip-favorite-commands.js';
export type { ClipFavoriteCommandsFeature } from './clip-favorite-commands.js';
