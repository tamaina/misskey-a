/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { IsNull } from 'typeorm';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface AdminDriveCleanupDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'deleteFile'>;
}
export function createAdminDriveCleanupProcedure(deps: AdminDriveCleanupDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['admin/drive/cleanup']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const _me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const files = await deps.driveFilesRepository.findBy({
				userId: IsNull(),
			});

			for (const file of files) {
				deps.driveService.deleteFile(file);
			}
		});
}
