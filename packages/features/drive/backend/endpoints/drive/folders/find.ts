/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';

@Injectable()
export class DriveFoldersFindOperation {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/folders/find'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const folders = await this.driveFoldersRepository.findBy({
			name: ps.name,
			userId: me.id,
			parentId: ps.parentId ?? IsNull(),
		});

		return await Promise.all(folders.map(folder => this.driveFolderEntityService.pack(folder)));
	}
}
