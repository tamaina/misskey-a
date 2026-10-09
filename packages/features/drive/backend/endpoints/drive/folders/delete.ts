/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFoldersDeleteErrors } from './delete.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFoldersRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFoldersDeleteOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private globalEventService: GlobalEventService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders/delete'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		// Get folder
		const folder = await this.driveFoldersRepository.findOneBy({
			id: ps.folderId,
			userId: me.id,
		});

		if (folder == null) {
			throw apiError(driveFoldersDeleteErrors.noSuchFolder);
		}

		const [childFoldersCount, childFilesCount] = await Promise.all([
			this.driveFoldersRepository.countBy({ parentId: folder.id }),
			this.driveFilesRepository.countBy({ folderId: folder.id }),
		]);

		if (childFoldersCount !== 0 || childFilesCount !== 0) {
			throw apiError(driveFoldersDeleteErrors.hasChildFilesOrFolders);
		}

		await this.driveFoldersRepository.delete(folder.id);

		// Publish folderCreated event
		this.globalEventService.publishDriveStream(me.id, 'folderDeleted', folder.id);
	}
}
