/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { JsonSchema } from '@valibot/to-json-schema';
import type { MiAntenna as _Antenna } from '@features/persistence/backend/repositories/models.js';
import type { ApiErrorDefinition } from '@features/api/contract/index.js';
import { toLegacyJsonSchema, featureProcedure } from '@features/api/backend/index.js';
import { portabilityImportContract, portabilityImportErrors, portabilityImportInputs } from '../contract/imports.js';
import type { PortabilityImportEndpoints } from '../contract/imports.js';

export type Antenna = (_Antenna & { userListAccts: string[] | null })[];

export interface PortabilityImportActor {
	id: string;
}

/** Narrow, feature-owned inputs to the legacy storage, account-move, file and queue services. */
export interface PortabilityImportDependencies<Actor extends PortabilityImportActor, File extends { id: string; size: number; url: string }> {
	userExists(userId: string): Promise<boolean>;
	findOwnedFile(fileId: string, ownerId: string): Promise<File | null | undefined>;
	countAntennas(ownerId: string): Promise<number>;
	getAntennaLimit(ownerId: string): Promise<number>;
	downloadTextFile(url: string): Promise<string>;
	isMovingDuringGracePeriod(actor: Actor): Promise<boolean>;
	createImportAntennasJob(actor: Actor, antennas: Antenna): unknown;
	createImportBlockingJob(actor: Actor, fileId: string): unknown;
	createImportFollowingJob(actor: Actor, fileId: string, withReplies: boolean | undefined): unknown;
	createImportMutingJob(actor: Actor, fileId: string): unknown;
	createImportUserListsJob(actor: Actor, fileId: string): unknown;
	createError(definition: ApiErrorDefinition): Error;
}

function requireActor<Actor extends PortabilityImportActor>(context: { actor: Actor } | null | undefined): Actor {
	const actor = context?.actor;
	if (actor == null || typeof actor.id !== 'string' || actor.id.length === 0) {
		throw new Error('An authenticated actor is required for portability import commands.');
	}
	return actor;
}

async function validateFileSize<Actor extends PortabilityImportActor, File extends { id: string; size: number; url: string }>(
	deps: PortabilityImportDependencies<Actor, File>,
	actor: Actor,
	file: File,
	tooBigFile: ApiErrorDefinition,
): Promise<void> {
	const isMoving = await deps.isMovingDuringGracePeriod(actor);
	if (isMoving ? file.size > 32 * 1024 * 1024 : file.size > 64 * 1024) {
		throw deps.createError(tooBigFile);
	}
}

/** User data import commands. Job enqueue calls intentionally remain fire-and-forget like the REST handlers. */
export function createPortabilityImportCommands<
	Actor extends PortabilityImportActor,
	File extends { id: string; size: number; url: string },
>(deps: PortabilityImportDependencies<Actor, File>) {
	const bind = featureProcedure<{ actor: Actor }>();

	const importAntennas = bind(portabilityImportContract['i/import-antennas'], async ({ input, context }) => {
		const actor = requireActor(context);
		if (!await deps.userExists(actor.id)) throw deps.createError(portabilityImportErrors['i/import-antennas'].noSuchUser);

		const file = await deps.findOwnedFile(input.fileId, actor.id);
		// Preserve the original strict-null test: TypeORM returns null; an unexpected undefined continues to the property access.
		if (file === null) throw deps.createError(portabilityImportErrors['i/import-antennas'].noSuchFile);
		const ownedFile = file!;
		if (ownedFile.size === 0) throw deps.createError(portabilityImportErrors['i/import-antennas'].emptyFile);

		const antennas = JSON.parse(await deps.downloadTextFile(ownedFile.url)) as Antenna;
		const currentAntennasCount = await deps.countAntennas(actor.id);
		if (currentAntennasCount + antennas.length >= await deps.getAntennaLimit(actor.id)) {
			throw deps.createError(portabilityImportErrors['i/import-antennas'].tooManyAntennas);
		}
		deps.createImportAntennasJob(actor, antennas);
	});

	const importBlocking = bind(portabilityImportContract['i/import-blocking'], async ({ input, context }) => {
		const actor = requireActor(context);
		const file = await deps.findOwnedFile(input.fileId, actor.id);
		if (file == null) throw deps.createError(portabilityImportErrors['i/import-blocking'].noSuchFile);
		if (file.size === 0) throw deps.createError(portabilityImportErrors['i/import-blocking'].emptyFile);
		await validateFileSize(deps, actor, file, portabilityImportErrors['i/import-blocking'].tooBigFile);
		deps.createImportBlockingJob(actor, file.id);
	});

	const importFollowing = bind(portabilityImportContract['i/import-following'], async ({ input, context }) => {
		const actor = requireActor(context);
		const file = await deps.findOwnedFile(input.fileId, actor.id);
		if (file == null) throw deps.createError(portabilityImportErrors['i/import-following'].noSuchFile);
		if (file.size === 0) throw deps.createError(portabilityImportErrors['i/import-following'].emptyFile);
		await validateFileSize(deps, actor, file, portabilityImportErrors['i/import-following'].tooBigFile);
		deps.createImportFollowingJob(actor, file.id, input.withReplies);
	});

	const importMuting = bind(portabilityImportContract['i/import-muting'], async ({ input, context }) => {
		const actor = requireActor(context);
		const file = await deps.findOwnedFile(input.fileId, actor.id);
		if (file == null) throw deps.createError(portabilityImportErrors['i/import-muting'].noSuchFile);
		if (file.size === 0) throw deps.createError(portabilityImportErrors['i/import-muting'].emptyFile);
		await validateFileSize(deps, actor, file, portabilityImportErrors['i/import-muting'].tooBigFile);
		deps.createImportMutingJob(actor, file.id);
	});

	const importUserLists = bind(portabilityImportContract['i/import-user-lists'], async ({ input, context }) => {
		const actor = requireActor(context);
		const file = await deps.findOwnedFile(input.fileId, actor.id);
		if (file == null) throw deps.createError(portabilityImportErrors['i/import-user-lists'].noSuchFile);
		if (file.size === 0) throw deps.createError(portabilityImportErrors['i/import-user-lists'].emptyFile);
		await validateFileSize(deps, actor, file, portabilityImportErrors['i/import-user-lists'].tooBigFile);
		deps.createImportUserListsJob(actor, file.id);
	});

	return {
		'i/import-antennas': importAntennas,
		'i/import-blocking': importBlocking,
		'i/import-following': importFollowing,
		'i/import-muting': importMuting,
		'i/import-user-lists': importUserLists,
	} satisfies { [K in keyof PortabilityImportEndpoints]: unknown };
}

export type PortabilityImportFeature<Actor extends PortabilityImportActor, File extends { id: string; size: number; url: string }> = ReturnType<typeof createPortabilityImportCommands<Actor, File>>;

export const legacyPortabilityImportSchemas: Record<keyof typeof portabilityImportInputs, { input: JsonSchema }> = {
	'i/import-antennas': { input: toLegacyJsonSchema(portabilityImportInputs['i/import-antennas']) },
	'i/import-blocking': { input: toLegacyJsonSchema(portabilityImportInputs['i/import-blocking']) },
	'i/import-following': { input: toLegacyJsonSchema(portabilityImportInputs['i/import-following']) },
	'i/import-muting': { input: toLegacyJsonSchema(portabilityImportInputs['i/import-muting']) },
	'i/import-user-lists': { input: toLegacyJsonSchema(portabilityImportInputs['i/import-user-lists']) },
};
