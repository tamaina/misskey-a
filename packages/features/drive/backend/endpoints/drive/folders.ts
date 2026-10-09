/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFolder } from '@features/notes/backend/drive.schema.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFolderEntityService } from '../../serializers/DriveFolderEntityService.js';
import { driveManagementContract } from '../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createDriveFoldersProcedure(deps: DriveFoldersDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const query = deps.queryService.makePaginationQuery(deps.driveFoldersRepository.createQueryBuilder('folder'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('folder.userId = :userId', { userId: me.id });

				if (ps.folderId) {
					query.andWhere('folder.parentId = :parentId', { parentId: ps.folderId });
				} else {
					query.andWhere('folder.parentId IS NULL');
				}

				const folders = await query.limit(ps.limit).getMany();

				return await Promise.all(folders.map(folder => deps.driveFolderEntityService.pack(folder)));
			})();
			return result.map(toPackedDriveFolder);
		});
}
