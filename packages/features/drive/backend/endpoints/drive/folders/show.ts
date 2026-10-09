/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFolder } from '@features/notes/backend/drive.schema.js';
import { driveFoldersShowErrors } from './show.contract.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersShowDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
}
export function createDriveFoldersShowProcedure(deps: DriveFoldersShowDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders/show']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
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
					throw apiError(driveFoldersShowErrors.noSuchFolder);
				}

				return await deps.driveFolderEntityService.pack(folder, {
					detail: true,
				});
			})();
			return toPackedDriveFolder(result);
		});
}
