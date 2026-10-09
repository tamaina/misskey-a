/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { IsNull } from 'typeorm';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AdminDriveCleanupDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'deleteFile'>;
}
export function createAdminDriveCleanupProcedure(deps: AdminDriveCleanupDependencies) {
	return implement(driveManagementContract['admin/drive/cleanup'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'admin/drive/cleanup', 'requireCredential': true, 'requireModerator': true, 'kind': 'write:admin:drive' })).use(requirePrincipal<MiLocalUser>())
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
