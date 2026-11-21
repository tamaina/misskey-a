/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFile } from '@features/notes/backend/drive.schema.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface AdminDriveFilesDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveFileEntityService: Pick<DriveFileEntityService, 'packMany'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createAdminDriveFilesProcedure(deps: AdminDriveFilesDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['admin/drive/files']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const _me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const query = deps.queryService.makePaginationQuery(deps.driveFilesRepository.createQueryBuilder('file'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate);

				if (ps.userId) {
					query.andWhere('file.userId = :userId', { userId: ps.userId });
				} else {
					if (ps.origin === 'local') {
						query.andWhere('file.userHost IS NULL');
					} else if (ps.origin === 'remote') {
						query.andWhere('file.userHost IS NOT NULL');
					}

					if (ps.hostname) {
						query.andWhere('file.userHost = :hostname', { hostname: ps.hostname });
					}
				}

				if (ps.type) {
					if (ps.type.endsWith('/*')) {
						query.andWhere('file.type like :type', { type: ps.type.replace('/*', '/') + '%' });
					} else {
						query.andWhere('file.type = :type', { type: ps.type });
					}
				}

				const files = await query.limit(ps.limit).getMany();

				return await deps.driveFileEntityService.packMany(files, { detail: true, withUser: true, self: true });
			})();
			return result.map(toPackedDriveFile);
		});
}
