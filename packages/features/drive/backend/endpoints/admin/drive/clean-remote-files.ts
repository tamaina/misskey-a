/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface AdminDriveCleanRemoteFilesDependencies {
	queueService: Pick<QueueService, 'createCleanRemoteFilesJob'>;
}
export function createAdminDriveCleanRemoteFilesProcedure(deps: AdminDriveCleanRemoteFilesDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['admin/drive/clean-remote-files']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const _me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			deps.queueService.createCleanRemoteFilesJob();
		});
}
