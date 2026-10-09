/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFilesMoveBulkDependencies {
	driveService: Pick<DriveService, 'moveFiles'>;
}
export function createDriveFilesMoveBulkProcedure(deps: DriveFilesMoveBulkDependencies) {
	return implement(driveManagementContract['drive/files/move-bulk'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/files/move-bulk', 'requireCredential': true, 'kind': 'write:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			await deps.driveService.moveFiles(ps.fileIds, ps.folderId ?? null, me.id);
		});
}
