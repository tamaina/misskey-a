/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { portabilityContract, portabilityInputs } from '../contract/index.js';
import type { PortabilityEndpoints } from '../contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';

export interface PortabilityActor {
	id: string;
}

/** Authenticated identity comes only from the trusted API adapter, never request input. */
export interface PortabilityContext {
	actor: PortabilityActor;
}

/** Narrow queue ports: portability owns orchestration, while boot supplies QueueService. */
export interface PortabilityDependencies {
	createExportAntennasJob(actor: PortabilityActor): unknown;
	createExportBlockingJob(actor: PortabilityActor): unknown;
	createExportClipsJob(actor: PortabilityActor): unknown;
	createExportFavoritesJob(actor: PortabilityActor): unknown;
	createExportFollowingJob(actor: PortabilityActor, excludeMuting: boolean, excludeInactive: boolean): unknown;
	createExportMuteJob(actor: PortabilityActor): unknown;
	createExportNotesJob(actor: PortabilityActor): unknown;
	createExportUserListsJob(actor: PortabilityActor): unknown;
}

function requireActor(context: PortabilityContext | null | undefined): PortabilityActor {
	const id = context?.actor?.id;
	if (typeof id !== 'string' || id.length === 0) {
		throw new Error('An authenticated actor is required for user data export.');
	}
	// Copy the id only so no caller-provided extra context fields reach the queue port.
	return { id };
}

export function createPortability(deps: PortabilityDependencies) {
	const clientContext = (clientContext: PortabilityContext) => clientContext;
	const exportAntennas = createProcedureClient(implement(portabilityContract['i/export-antennas'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportAntennasJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportBlocking = createProcedureClient(implement(portabilityContract['i/export-blocking'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportBlockingJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportClips = createProcedureClient(implement(portabilityContract['i/export-clips'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportClipsJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportFavorites = createProcedureClient(implement(portabilityContract['i/export-favorites'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportFavoritesJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportFollowing = createProcedureClient(implement(portabilityContract['i/export-following'])
		.$context<PortabilityContext>()
		.handler(async ({ input, context }) => {
			deps.createExportFollowingJob(requireActor(context), input.excludeMuting, input.excludeInactive);
		}), {
		context: clientContext,
	});

	const exportMute = createProcedureClient(implement(portabilityContract['i/export-mute'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportMuteJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportNotes = createProcedureClient(implement(portabilityContract['i/export-notes'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportNotesJob(requireActor(context));
		}), {
		context: clientContext,
	});

	const exportUserLists = createProcedureClient(implement(portabilityContract['i/export-user-lists'])
		.$context<PortabilityContext>()
		.handler(async ({ context }) => {
			deps.createExportUserListsJob(requireActor(context));
		}), {
		context: clientContext,
	});

	return {
		'i/export-antennas': exportAntennas,
		'i/export-blocking': exportBlocking,
		'i/export-clips': exportClips,
		'i/export-favorites': exportFavorites,
		'i/export-following': exportFollowing,
		'i/export-mute': exportMute,
		'i/export-notes': exportNotes,
		'i/export-user-lists': exportUserLists,
	} satisfies { [K in keyof PortabilityEndpoints]: unknown };
}

export type PortabilityFeature = ReturnType<typeof createPortability>;

export { createPortabilityImportCommands, legacyPortabilityImportSchemas } from './import-commands.js';
export type { Antenna, PortabilityImportActor, PortabilityImportDependencies, PortabilityImportFeature } from './import-commands.js';

export const legacyPortabilitySchemas: Record<keyof typeof portabilityInputs, { input: JsonSchema }> = {
	'i/export-antennas': { input: toLegacyJsonSchema(portabilityInputs['i/export-antennas']) },
	'i/export-blocking': { input: toLegacyJsonSchema(portabilityInputs['i/export-blocking']) },
	'i/export-clips': { input: toLegacyJsonSchema(portabilityInputs['i/export-clips']) },
	'i/export-favorites': { input: toLegacyJsonSchema(portabilityInputs['i/export-favorites']) },
	'i/export-following': { input: toLegacyJsonSchema(portabilityInputs['i/export-following']) },
	'i/export-mute': { input: toLegacyJsonSchema(portabilityInputs['i/export-mute']) },
	'i/export-notes': { input: toLegacyJsonSchema(portabilityInputs['i/export-notes']) },
	'i/export-user-lists': { input: toLegacyJsonSchema(portabilityInputs['i/export-user-lists']) },
};
