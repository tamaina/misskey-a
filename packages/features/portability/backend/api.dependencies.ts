/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { AntennaArtifact } from './antenna-artifact.schema.js';
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
