/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { Injectable } from '@nestjs/common';

import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DriveService } from '../../../services/DriveService.js';

@Injectable()
export class DriveFilesUploadFromUrlOperation {
	constructor(
		private driveFileEntityService: DriveFileEntityService,
		private driveService: DriveService,
		private globalEventService: GlobalEventService,
	) {
	}

	async execute(ps: DriveManagementInputs['drive/files/upload-from-url'], user: MiLocalUser, ip: string, headers: Record<string, string | string[] | undefined>) {
		this.driveService.uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
			this.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
				this.globalEventService.publishMainStream(user.id, 'urlUploadFinished', {
					marker: ps.marker,
					file: packedFile,
				});
			});
		});
	}
}
