/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../../services/DriveService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class AdminDriveCleanupOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {
	}

	async execute(_ps: DriveManagementInputs['admin/drive/cleanup'], _me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const files = await this.driveFilesRepository.findBy({
			userId: IsNull(),
		});

		for (const file of files) {
			this.driveService.deleteFile(file);
		}
	}
}
