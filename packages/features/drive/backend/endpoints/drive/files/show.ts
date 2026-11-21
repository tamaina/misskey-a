/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
import { driveFilesShowErrors } from './show.contract.js';
import type { DriveFileSelectorRepository } from '../../../selector.repository.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesShowDependencies {
	driveFileSelectorRepository: DriveFileSelectorRepository;
	driveFileEntityService: Pick<DriveFileEntityService, 'pack'>;
	roleService: Pick<RoleService, 'isModerator'>;
}
export function createDriveFilesShowProcedure(deps: DriveFilesShowDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/show']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const file = await deps.driveFileSelectorRepository.findOneBy(
					ps.fileId !== undefined
						? { id: ps.fileId }
						: [{ url: ps.url }, { webpublicUrl: ps.url }, { thumbnailUrl: ps.url }],
				);

				if (file == null) {
					throw apiError(driveFilesShowErrors.noSuchFile);
				}

				if (!await deps.roleService.isModerator(me) && (file.userId !== me.id)) {
					throw apiError(driveFilesShowErrors.accessDenied);
				}

				return await deps.driveFileEntityService.pack(file, {
					detail: true,
					withUser: true,
					self: true,
				});
			})();
			return toPackedDriveFile(result);
		});
}
