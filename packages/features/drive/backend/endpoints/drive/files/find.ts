/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DriveFilesFindOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/find'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const files = await this.driveFilesRepository.findBy({
			name: ps.name,
			userId: me.id,
			folderId: ps.folderId ?? IsNull(),
		});

		return await this.driveFileEntityService.packMany(files, { self: true });
	}
}
