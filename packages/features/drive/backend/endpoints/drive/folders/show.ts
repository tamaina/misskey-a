/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFoldersShowErrors } from './show.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFoldersShowOperation {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders/show'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		// Get folder
		const folder = await this.driveFoldersRepository.findOneBy({
			id: ps.folderId,
			userId: me.id,
		});

		if (folder == null) {
			throw apiError(driveFoldersShowErrors.noSuchFolder);
		}

		return await this.driveFolderEntityService.pack(folder, {
			detail: true,
		});
	}
}
