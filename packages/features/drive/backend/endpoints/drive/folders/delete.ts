/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { driveFoldersDeleteErrors } from './delete.contract.js';
import type { DriveFoldersRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersDeleteDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveFoldersRepository: DriveFoldersRepository;
	globalEventService: Pick<GlobalEventService, 'publishDriveStream'>;
}
export function createDriveFoldersDeleteProcedure(deps: DriveFoldersDeleteDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders/delete']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			// Get folder
			const folder = await deps.driveFoldersRepository.findOneBy({
				id: ps.folderId,
				userId: me.id,
			});

			if (folder == null) {
				throw apiError(driveFoldersDeleteErrors.noSuchFolder);
			}

			const [childFoldersCount, childFilesCount] = await Promise.all([
				deps.driveFoldersRepository.countBy({ parentId: folder.id }),
				deps.driveFilesRepository.countBy({ folderId: folder.id }),
			]);

			if (childFoldersCount !== 0 || childFilesCount !== 0) {
				throw apiError(driveFoldersDeleteErrors.hasChildFilesOrFolders);
			}

			await deps.driveFoldersRepository.delete(folder.id);

			// Publish folderCreated event
			deps.globalEventService.publishDriveStream(me.id, 'folderDeleted', folder.id);
		});
}
