/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiError, type ErrorDefinition } from '../../api/backend/transport/orpc-error.js';
import { parseAntennaArtifact, type AntennaArtifact } from './antenna-artifact.schema.js';
import { iImportAntennasErrors } from './endpoints/i/import-antennas.contract.js';
import { iImportBlockingErrors } from './endpoints/i/import-blocking.contract.js';
import { iImportFollowingErrors } from './endpoints/i/import-following.contract.js';
import { iImportMutingErrors } from './endpoints/i/import-muting.contract.js';
import { iImportUserListsErrors } from './endpoints/i/import-user-lists.contract.js';
import type { PortabilityOperations } from './api.router.js';
import type { ApiActor } from '../../api/backend/transport/context.js';

export interface PortabilityDependencies<Actor extends ApiActor, File extends { id: string; size: number; url: string }> {
	userExists(userId: string): Promise<boolean>;
	findOwnedFile(fileId: string, ownerId: string): Promise<File | null | undefined>;
	countAntennas(ownerId: string): Promise<number>;
	getAntennaLimit(ownerId: string): Promise<number>;
	downloadTextFile(url: string): Promise<string>;
	isMovingDuringGracePeriod(actor: Actor): Promise<boolean>;
	createImportAntennasJob(actor: Actor, artifact: AntennaArtifact): void;
	createImportBlockingJob(actor: Actor, fileId: string): void;
	createImportFollowingJob(actor: Actor, fileId: string, withReplies: boolean | undefined): void;
	createImportMutingJob(actor: Actor, fileId: string): void;
	createImportUserListsJob(actor: Actor, fileId: string): void;
	createExportAntennasJob(actor: { id: string }): void;
	createExportBlockingJob(actor: { id: string }): void;
	createExportClipsJob(actor: { id: string }): void;
	createExportFavoritesJob(actor: { id: string }): void;
	createExportFollowingJob(actor: { id: string }, excludeMuting: boolean, excludeInactive: boolean): void;
	createExportMuteJob(actor: { id: string }): void;
	createExportNotesJob(actor: { id: string }): void;
	createExportUserListsJob(actor: { id: string }): void;
}

/** Retain the original JavaScript length comparison without validating the artifact's domain upfront. */
export function exceedsAntennaLimit(count: number, artifact: AntennaArtifact, limit: number): boolean {
	if (artifact === null) throw new TypeError('Cannot read properties of null (reading length)');
	const length = Array.isArray(artifact) || typeof artifact === 'string' ? artifact.length : typeof artifact === 'object' ? artifact.length : undefined;
	const combined = typeof length === 'string' || (length !== null && typeof length === 'object')
		? String(count) + String(length)
		: count + Number(length);
	return Number(combined) >= limit;
}

export function createPortabilityOperations<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: PortabilityDependencies<Actor, File>): PortabilityOperations<Actor> {
	async function importFile(actor: Actor, fileId: string, errors: { noSuchFile: ErrorDefinition; emptyFile: ErrorDefinition; tooBigFile: ErrorDefinition }): Promise<File> {
		const file = await deps.findOwnedFile(fileId, actor.id);
		if (file == null) throw apiError(errors.noSuchFile);
		if (file.size === 0) throw apiError(errors.emptyFile);
		const moving = await deps.isMovingDuringGracePeriod(actor);
		if (moving ? file.size > 32 * 1024 * 1024 : file.size > 64 * 1024) throw apiError(errors.tooBigFile);
		return file;
	}

	return {
		'i/export-antennas': async (_input, actor) => { deps.createExportAntennasJob({ id: actor.id }); },
		'i/export-blocking': async (_input, actor) => { deps.createExportBlockingJob({ id: actor.id }); },
		'i/export-clips': async (_input, actor) => { deps.createExportClipsJob({ id: actor.id }); },
		'i/export-favorites': async (_input, actor) => { deps.createExportFavoritesJob({ id: actor.id }); },
		'i/export-following': async (input, actor) => { deps.createExportFollowingJob({ id: actor.id }, input.excludeMuting, input.excludeInactive); },
		'i/export-mute': async (_input, actor) => { deps.createExportMuteJob({ id: actor.id }); },
		'i/export-notes': async (_input, actor) => { deps.createExportNotesJob({ id: actor.id }); },
		'i/export-user-lists': async (_input, actor) => { deps.createExportUserListsJob({ id: actor.id }); },
		'i/import-antennas': async (input, actor) => {
			if (!await deps.userExists(actor.id)) throw apiError(iImportAntennasErrors.noSuchUser);
			const file = await deps.findOwnedFile(input.fileId, actor.id);
			if (file === null) throw apiError(iImportAntennasErrors.noSuchFile);
			if (file === undefined) throw new TypeError('Missing owned file');
			if (file.size === 0) throw apiError(iImportAntennasErrors.emptyFile);
			const artifact = parseAntennaArtifact(await deps.downloadTextFile(file.url));
			const count = await deps.countAntennas(actor.id);
			if (exceedsAntennaLimit(count, artifact, await deps.getAntennaLimit(actor.id))) throw apiError(iImportAntennasErrors.tooManyAntennas);
			deps.createImportAntennasJob(actor, artifact);
		},
		'i/import-blocking': async (input, actor) => { const file = await importFile(actor, input.fileId, iImportBlockingErrors); deps.createImportBlockingJob(actor, file.id); },
		'i/import-following': async (input, actor) => { const file = await importFile(actor, input.fileId, iImportFollowingErrors); deps.createImportFollowingJob(actor, file.id, input.withReplies); },
		'i/import-muting': async (input, actor) => { const file = await importFile(actor, input.fileId, iImportMutingErrors); deps.createImportMutingJob(actor, file.id); },
		'i/import-user-lists': async (input, actor) => { const file = await importFile(actor, input.fileId, iImportUserListsErrors); deps.createImportUserListsJob(actor, file.id); },
	};
}
