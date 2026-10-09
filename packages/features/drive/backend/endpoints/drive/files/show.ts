/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { driveFilesShowErrors } from './show.contract.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFileSelectorRepository } from '../../../selector.repository.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class DriveFilesShowOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFileSelectorRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/show'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const file = await this.driveFilesRepository.findOneBy(
			ps.fileId !== undefined
				? { id: ps.fileId }
				: [{ url: ps.url }, { webpublicUrl: ps.url }, { thumbnailUrl: ps.url }],
		);

		if (file == null) {
			throw apiError(driveFilesShowErrors.noSuchFile);
		}

		if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
			throw apiError(driveFilesShowErrors.accessDenied);
		}

		return await this.driveFileEntityService.pack(file, {
			detail: true,
			withUser: true,
			self: true,
		});
	}
}
