/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DriveService } from '../../../services/DriveService.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFilesUploadFromUrlDependencies {
	driveFileEntityService: Pick<DriveFileEntityService, 'pack'>;
	driveService: Pick<DriveService, 'uploadFromUrl'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream'>;
}
export function createDriveFilesUploadFromUrlProcedure(deps: DriveFilesUploadFromUrlDependencies) {
	return implement(driveManagementContract['drive/files/upload-from-url'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/files/upload-from-url', 'requireCredential': true, 'prohibitMoved': true, 'kind': 'write:drive', 'limit': { 'duration': 3600000, 'max': 60 } })).use(requirePrincipal<MiLocalUser>())
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
