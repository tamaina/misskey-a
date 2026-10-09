/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Injectable } from '@nestjs/common';

import { QueueService } from '@features/runtime/backend/services/QueueService.js';

@Injectable()
export class AdminDriveCleanRemoteFilesOperation {
	constructor(
		private queueService: QueueService,
	) {
	}

	async execute(_ps: DriveManagementInputs['admin/drive/clean-remote-files'], _me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		this.queueService.createCleanRemoteFilesJob();
	}
}
