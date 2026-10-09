/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFoldersUpdateErrors } from './update.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFoldersUpdateOperation {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private globalEventService: GlobalEventService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders/update'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		// Fetch folder
		const folder = await this.driveFoldersRepository.findOneBy({
			id: ps.folderId,
			userId: me.id,
		});

		if (folder == null) {
			throw apiError(driveFoldersUpdateErrors.noSuchFolder);
		}

		if (ps.name) folder.name = ps.name;

		if (ps.parentId !== undefined) {
			if (ps.parentId === folder.id) {
				throw apiError(driveFoldersUpdateErrors.recursiveNesting);
			} else if (ps.parentId === null) {
				folder.parentId = null;
			} else {
				// Get parent folder
				const parent = await this.driveFoldersRepository.findOneBy({
					id: ps.parentId,
					userId: me.id,
				});

				if (parent == null) {
					throw apiError(driveFoldersUpdateErrors.noSuchParentFolder);
				}

				// Check if the circular reference will occur
				const checkCircle = async (folderId: string): Promise<boolean> => {
					const folder2 = await this.driveFoldersRepository.findOneByOrFail({
						id: folderId,
					});

					if (folder2.id === folder.id) {
						return true;
					} else if (folder2.parentId) {
						return await checkCircle(folder2.parentId);
					} else {
						return false;
					}
				};

				if (parent.parentId !== null) {
					if (await checkCircle(parent.parentId)) {
						throw apiError(driveFoldersUpdateErrors.recursiveNesting);
					}
				}

				folder.parentId = parent.id;
			}
		}

		// Update
		await this.driveFoldersRepository.update(folder.id, {
			name: folder.name,
			parentId: folder.parentId,
		});

		const folderObj = await this.driveFolderEntityService.pack(folder);

		// Publish folderUpdated event
		this.globalEventService.publishDriveStream(me.id, 'folderUpdated', folderObj);

		return folderObj;
	}
}
