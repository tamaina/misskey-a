/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesMoveBulkDependencies {
	driveService: Pick<DriveService, 'moveFiles'>;
}
export function createDriveFilesMoveBulkProcedure(deps: DriveFilesMoveBulkDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/move-bulk']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			await deps.driveService.moveFiles(ps.fileIds, ps.folderId ?? null, me.id);
		});
}
