/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';

import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesFindByHashDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveFileEntityService: Pick<DriveFileEntityService, 'packMany'>;
}
export function createDriveFilesFindByHashProcedure(deps: DriveFilesFindByHashDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/find-by-hash']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const files = await deps.driveFilesRepository.findBy({
					md5: ps.md5,
					userId: me.id,
				});

				return await deps.driveFileEntityService.packMany(files, { self: true });
			})();
			return result.map(toPackedDriveFile);
		});
}
