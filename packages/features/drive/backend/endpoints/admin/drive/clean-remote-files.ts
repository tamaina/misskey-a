/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface AdminDriveCleanRemoteFilesDependencies {
	queueService: Pick<QueueService, 'createCleanRemoteFilesJob'>;
}
export function createAdminDriveCleanRemoteFilesProcedure(deps: AdminDriveCleanRemoteFilesDependencies) {
	return implement(driveManagementContract['admin/drive/clean-remote-files'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'admin/drive/clean-remote-files', 'requireCredential': true, 'requireModerator': true, 'kind': 'write:admin:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const _me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			deps.queueService.createCleanRemoteFilesJob();
		});
}
