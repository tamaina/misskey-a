/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Injectable } from '@nestjs/common';

import { DriveService } from '../../../services/DriveService.js';

@Injectable()
export class DriveFilesMoveBulkOperation {
	constructor(
		private driveService: DriveService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/move-bulk'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		await this.driveService.moveFiles(ps.fileIds, ps.folderId ?? null, me.id);
	}
}
