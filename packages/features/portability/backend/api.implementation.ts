/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { AntennaArtifact } from './antenna-artifact.schema.js';
import { implement } from '@orpc/server';
import { portabilityApiContract } from './api.definition.js';
import { createIExportAntennasProcedure } from './endpoints/i/export-antennas.js';
import { createIExportBlockingProcedure } from './endpoints/i/export-blocking.js';
import { createIExportClipsProcedure } from './endpoints/i/export-clips.js';
import { createIExportFavoritesProcedure } from './endpoints/i/export-favorites.js';
import { createIExportFollowingProcedure } from './endpoints/i/export-following.js';
import { createIExportMuteProcedure } from './endpoints/i/export-mute.js';
import { createIExportNotesProcedure } from './endpoints/i/export-notes.js';
import { createIExportUserListsProcedure } from './endpoints/i/export-user-lists.js';
import { createIImportAntennasProcedure } from './endpoints/i/import-antennas.js';
import { createIImportBlockingProcedure } from './endpoints/i/import-blocking.js';
import { createIImportFollowingProcedure } from './endpoints/i/import-following.js';
import { createIImportMutingProcedure } from './endpoints/i/import-muting.js';
import { createIImportUserListsProcedure } from './endpoints/i/import-user-lists.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';

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

export function createPortabilityRouter<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: PortabilityDependencies<Actor, File>) {
	return implement(portabilityApiContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		'i/export-antennas': createIExportAntennasProcedure<Actor, File>(deps),
		'i/export-blocking': createIExportBlockingProcedure<Actor, File>(deps),
		'i/export-clips': createIExportClipsProcedure<Actor, File>(deps),
		'i/export-favorites': createIExportFavoritesProcedure<Actor, File>(deps),
		'i/export-following': createIExportFollowingProcedure<Actor, File>(deps),
		'i/export-mute': createIExportMuteProcedure<Actor, File>(deps),
		'i/export-notes': createIExportNotesProcedure<Actor, File>(deps),
		'i/export-user-lists': createIExportUserListsProcedure<Actor, File>(deps),
		'i/import-antennas': createIImportAntennasProcedure<Actor, File>(deps),
		'i/import-blocking': createIImportBlockingProcedure<Actor, File>(deps),
		'i/import-following': createIImportFollowingProcedure<Actor, File>(deps),
		'i/import-muting': createIImportMutingProcedure<Actor, File>(deps),
		'i/import-user-lists': createIImportUserListsProcedure<Actor, File>(deps),
	});
}

type PortabilityRouter = ReturnType<typeof createPortabilityRouter<MiLocalUser, import('@features/drive/backend/models/DriveFile.js').MiDriveFile>>;

@Injectable()
export class PortabilityApiProvider {
	private router: PortabilityRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): PortabilityRouter {
		if (this.router !== undefined) return this.router;
		const users = this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false });
		const files = this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false });
		const antennas = this.moduleRef.get<AntennasRepository>(DI.antennasRepository, { strict: false });
		const roles = this.moduleRef.get(RoleService, { strict: false });
		const downloads = this.moduleRef.get(DownloadService, { strict: false });
		const moves = this.moduleRef.get(AccountMoveService, { strict: false });
		const queue = this.moduleRef.get(QueueService, { strict: false });
		this.router = createPortabilityRouter<MiLocalUser, import('@features/drive/backend/models/DriveFile.js').MiDriveFile>({
			userExists: id => users.exists({ where: { id } }),
			findOwnedFile: (id, userId) => files.findOneBy({ id, userId }),
			countAntennas: userId => antennas.countBy({ userId }),
			getAntennaLimit: async userId => (await roles.getUserPolicies(userId)).antennaLimit,
			downloadTextFile: url => downloads.downloadTextFile(url),
			isMovingDuringGracePeriod: async actor => (await moves.validateAlsoKnownAs(actor, (_old, src) => !!src.movedAt && src.movedAt.getTime() + 1000 * 60 * 60 * 2 > Date.now(), true)) !== null,
			createImportAntennasJob: (actor, artifact) => { queue.createImportAntennasJob(actor, artifact); },
			createImportBlockingJob: (actor, id) => { queue.createImportBlockingJob(actor, id); },
			createImportFollowingJob: (actor, id, withReplies) => { queue.createImportFollowingJob(actor, id, withReplies); },
			createImportMutingJob: (actor, id) => { queue.createImportMutingJob(actor, id); },
			createImportUserListsJob: (actor, id) => { queue.createImportUserListsJob(actor, id); },
			createExportAntennasJob: (actor) => { queue.createExportAntennasJob(actor); },
			createExportBlockingJob: (actor) => { queue.createExportBlockingJob(actor); },
			createExportClipsJob: (actor) => { queue.createExportClipsJob(actor); },
			createExportFavoritesJob: (actor) => { queue.createExportFavoritesJob(actor); },
			createExportFollowingJob: (actor, excludeMuting, excludeInactive) => { queue.createExportFollowingJob(actor, excludeMuting, excludeInactive); },
			createExportMuteJob: (actor) => { queue.createExportMuteJob(actor); },
			createExportNotesJob: (actor) => { queue.createExportNotesJob(actor); },
			createExportUserListsJob: (actor) => { queue.createExportUserListsJob(actor); },
		});
		return this.router;
	}
}
