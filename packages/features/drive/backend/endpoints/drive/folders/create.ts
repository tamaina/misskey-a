/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiDriveFolder } from '../../../models/DriveFolder.js';
import { toPackedDriveFolder } from '@features/notes/backend/drive.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { driveFoldersCreateErrors } from './create.contract.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersCreateDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
	idService: Pick<IdService, 'gen'>;
	globalEventService: Pick<GlobalEventService, 'publishDriveStream'>;
}
export function createDriveFoldersCreateProcedure(deps: DriveFoldersCreateDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders/create']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				// If the parent folder is specified
				let parent: MiDriveFolder | null = null;
				if (ps.parentId) {
					// Fetch parent folder
					parent = await deps.driveFoldersRepository.findOneBy({
						id: ps.parentId,
						userId: me.id,
					});

					if (parent == null) {
						throw apiError(driveFoldersCreateErrors.noSuchFolder);
					}
				}

				// Create folder
				const folder = await deps.driveFoldersRepository.insertOne({
					id: deps.idService.gen(),
					name: ps.name,
					parentId: parent !== null ? parent.id : null,
					userId: me.id,
				});

				const folderObj = await deps.driveFolderEntityService.pack(folder);

				// Publish folderCreated event
				deps.globalEventService.publishDriveStream(me.id, 'folderCreated', folderObj);

				return folderObj;
			})();
			return toPackedDriveFolder(result);
		});
}
