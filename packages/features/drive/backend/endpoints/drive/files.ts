/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFileEntityService } from '../../serializers/DriveFileEntityService.js';
import { driveManagementContract } from '../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveFileEntityService: Pick<DriveFileEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createDriveFilesProcedure(deps: DriveFilesDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const query = deps.queryService.makePaginationQuery(deps.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('file.userId = :userId', { userId: me.id });

				if (ps.folderId) {
					query.andWhere('file.folderId = :folderId', { folderId: ps.folderId });
				} else {
					query.andWhere('file.folderId IS NULL');
				}

				if (ps.type) {
					if (ps.type.endsWith('/*')) {
						query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
					} else {
						query.andWhere('file.type = :type', { type: ps.type });
					}
				}

				switch (ps.sort) {
					case '+createdAt': query.orderBy('file.id', 'DESC'); break;
					case '-createdAt': query.orderBy('file.id', 'ASC'); break;
					case '+name': query.orderBy('file.name', 'DESC'); break;
					case '-name': query.orderBy('file.name', 'ASC'); break;
					case '+size': query.orderBy('file.size', 'DESC'); break;
					case '-size': query.orderBy('file.size', 'ASC'); break;
				}

				const files = await query.limit(ps.limit).getMany();

				return await deps.driveFileEntityService.packMany(files, { detail: false, self: true });
			})();
			return result.map(toPackedDriveFile);
		});
}
