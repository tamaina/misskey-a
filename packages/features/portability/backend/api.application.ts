/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { createPortabilityOperations } from './operations.js';
import type { PortabilityOperations } from './api.router.js';

@Injectable()
export class PortabilityApplicationService implements PortabilityOperations<MiLocalUser> {
	private readonly operations: PortabilityOperations<MiLocalUser>;
	constructor(
		@Inject(DI.usersRepository) users: UsersRepository,
		@Inject(DI.driveFilesRepository) files: DriveFilesRepository,
		@Inject(DI.antennasRepository) antennas: AntennasRepository,
		roles: RoleService,
		downloads: DownloadService,
		moves: AccountMoveService,
		queue: QueueService,
	) {
		this.operations = createPortabilityOperations<MiLocalUser, import('../../drive/backend/models/DriveFile.js').MiDriveFile>({
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
	}

	'i/export-antennas': PortabilityOperations<MiLocalUser>['i/export-antennas'] = async (input, actor) => this.operations['i/export-antennas'](input, actor);
	'i/export-blocking': PortabilityOperations<MiLocalUser>['i/export-blocking'] = async (input, actor) => this.operations['i/export-blocking'](input, actor);
	'i/export-clips': PortabilityOperations<MiLocalUser>['i/export-clips'] = async (input, actor) => this.operations['i/export-clips'](input, actor);
	'i/export-favorites': PortabilityOperations<MiLocalUser>['i/export-favorites'] = async (input, actor) => this.operations['i/export-favorites'](input, actor);
	'i/export-following': PortabilityOperations<MiLocalUser>['i/export-following'] = async (input, actor) => this.operations['i/export-following'](input, actor);
	'i/export-mute': PortabilityOperations<MiLocalUser>['i/export-mute'] = async (input, actor) => this.operations['i/export-mute'](input, actor);
	'i/export-notes': PortabilityOperations<MiLocalUser>['i/export-notes'] = async (input, actor) => this.operations['i/export-notes'](input, actor);
	'i/export-user-lists': PortabilityOperations<MiLocalUser>['i/export-user-lists'] = async (input, actor) => this.operations['i/export-user-lists'](input, actor);
	'i/import-antennas': PortabilityOperations<MiLocalUser>['i/import-antennas'] = async (input, actor) => this.operations['i/import-antennas'](input, actor);
	'i/import-blocking': PortabilityOperations<MiLocalUser>['i/import-blocking'] = async (input, actor) => this.operations['i/import-blocking'](input, actor);
	'i/import-following': PortabilityOperations<MiLocalUser>['i/import-following'] = async (input, actor) => this.operations['i/import-following'](input, actor);
	'i/import-muting': PortabilityOperations<MiLocalUser>['i/import-muting'] = async (input, actor) => this.operations['i/import-muting'](input, actor);
	'i/import-user-lists': PortabilityOperations<MiLocalUser>['i/import-user-lists'] = async (input, actor) => this.operations['i/import-user-lists'](input, actor);
}

export const portabilityProviders = [PortabilityApplicationService];
