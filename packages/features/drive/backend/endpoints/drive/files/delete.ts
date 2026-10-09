/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { driveFilesDeleteErrors } from './delete.contract.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '../../../services/DriveService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFilesDeleteDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'deleteFile'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createDriveFilesDeleteProcedure(deps: DriveFilesDeleteDependencies) {
	return implement(driveManagementContract['drive/files/delete'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/files/delete', 'requireCredential': true, 'kind': 'write:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const file = await deps.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw apiError(driveFilesDeleteErrors.noSuchFile);
			}

			if (!await deps.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw apiError(driveFilesDeleteErrors.accessDenied);
			}

			await deps.driveService.deleteFile(file, false, me);
		});
}
