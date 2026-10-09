/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFilesDeleteErrors } from './delete.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../../services/DriveService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFilesDeleteOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/delete'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

		if (file == null) {
			throw apiError(driveFilesDeleteErrors.noSuchFile);
		}

		if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
			throw apiError(driveFilesDeleteErrors.accessDenied);
		}

		await this.driveService.deleteFile(file, false, me);
	}
}
