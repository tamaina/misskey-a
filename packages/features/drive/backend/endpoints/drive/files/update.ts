/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFilesUpdateErrors } from './update.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DriveService } from '../../../services/DriveService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFilesUpdateOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private roleService: RoleService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/update'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
		if (file == null) {
			throw apiError(driveFilesUpdateErrors.noSuchFile);
		}

		if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
			throw apiError(driveFilesUpdateErrors.accessDenied);
		}

		let packedFile: Awaited<ReturnType<DriveService['updateFile']>>;

		try {
			packedFile = await this.driveService.updateFile(file, {
				folderId: ps.folderId,
				name: ps.name,
				isSensitive: ps.isSensitive,
				comment: ps.comment,
			}, me);
		} catch (e) {
			if (e instanceof DriveService.InvalidFileNameError) {
				throw apiError(driveFilesUpdateErrors.invalidFileName);
			} else if (e instanceof DriveService.NoSuchFolderError) {
				throw apiError(driveFilesUpdateErrors.noSuchFolder);
			} else if (e instanceof DriveService.CannotUnmarkSensitiveError) {
				throw apiError(driveFilesUpdateErrors.restrictedByRole);
			} else {
				throw e;
			}
		}

		return packedFile;
	}
}
