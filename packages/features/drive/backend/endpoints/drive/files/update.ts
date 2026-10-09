/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
import { driveFilesUpdateErrors } from './update.contract.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { DriveService } from '../../../services/DriveService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesUpdateDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'updateFile'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createDriveFilesUpdateProcedure(deps: DriveFilesUpdateDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/update']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const file = await deps.driveFilesRepository.findOneBy({ id: ps.fileId });
				if (file == null) {
					throw apiError(driveFilesUpdateErrors.noSuchFile);
				}

				if (!await deps.roleService.isModerator(me) && (file.userId !== me.id)) {
					throw apiError(driveFilesUpdateErrors.accessDenied);
				}

				let packedFile: Awaited<ReturnType<DriveService['updateFile']>>;

				try {
					packedFile = await deps.driveService.updateFile(file, {
						folderId: ps.folderId,
						name: ps.name,
						isSensitive: ps.isSensitive,
						comment: ps.comment,
					}, me);
				} catch (e) {
					if (e instanceof DriveService.InvalidFileNameError) {
						throw apiError(driveFilesUpdateErrors.invalidFileName);
					} else if (e instanceof DriveService.NoSuchFolderError) {
						throw apiError(driveFilesUpdateErrors.noSuchFolder);
					} else if (e instanceof DriveService.CannotUnmarkSensitiveError) {
						throw apiError(driveFilesUpdateErrors.restrictedByRole);
					} else {
						throw e;
					}
				}

				return packedFile;
			})();
			return toPackedDriveFile(result);
		});
}
