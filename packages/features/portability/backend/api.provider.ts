/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository, AntennasRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DownloadService } from '@features/runtime/backend/services/DownloadService.js';
import { AccountMoveService } from '@features/users/backend/services/AccountMoveService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { createPortabilityRouter } from './api.router.js';
type PortabilityRouter = ReturnType<typeof createPortabilityRouter<MiLocalUser, import('../../drive/backend/models/DriveFile.js').MiDriveFile>>;
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
		this.router = createPortabilityRouter<MiLocalUser, import('../../drive/backend/models/DriveFile.js').MiDriveFile>({
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
