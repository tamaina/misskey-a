/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiDriveFolder } from '../../../models/DriveFolder.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFoldersCreateErrors } from './create.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFoldersCreateOperation {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders/create'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		// If the parent folder is specified
		let parent: MiDriveFolder | null = null;
		if (ps.parentId) {
			// Fetch parent folder
			parent = await this.driveFoldersRepository.findOneBy({
				id: ps.parentId,
				userId: me.id,
			});

			if (parent == null) {
				throw apiError(driveFoldersCreateErrors.noSuchFolder);
			}
		}

		// Create folder
		const folder = await this.driveFoldersRepository.insertOne({
			id: this.idService.gen(),
			name: ps.name,
			parentId: parent !== null ? parent.id : null,
			userId: me.id,
		});

		const folderObj = await this.driveFolderEntityService.pack(folder);

		// Publish folderCreated event
		this.globalEventService.publishDriveStream(me.id, 'folderCreated', folderObj);

		return folderObj;
	}
}
