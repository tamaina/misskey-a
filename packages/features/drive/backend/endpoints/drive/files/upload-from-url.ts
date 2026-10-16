/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesUploadFromUrlDependencies {
	driveFileEntityService: Pick<DriveFileEntityService, 'pack'>;
	driveService: Pick<DriveService, 'uploadFromUrl'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createDriveFilesUploadFromUrlProcedure(deps: DriveFilesUploadFromUrlDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/upload-from-url']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const user = context.principal;
			const ip = context.ip;
			const headers = context.headers;
			deps.driveService.uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
				deps.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
					deps.globalEventService.publishMainStream(user.id, 'urlUploadFinished', {
						marker: ps.marker,
						file: packedFile,
					});
				});
			});
		});
}
