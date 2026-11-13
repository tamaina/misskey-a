/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../services/DriveService.js';
import { driveManagementContract } from '../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface AdminDeleteAllFilesOfAUserDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'deleteFile'>;
}
export function createAdminDeleteAllFilesOfAUserProcedure(deps: AdminDeleteAllFilesOfAUserDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['admin/delete-all-files-of-a-user']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const _me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const files = await deps.driveFilesRepository.findBy({
				userId: ps.userId,
			});

			for (const file of files) {
				deps.driveService.deleteFile(file);
			}
		});
}
