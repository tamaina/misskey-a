/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { DriveFolderEntityService } from '../../serializers/DriveFolderEntityService.js';
import { driveManagementContract } from '../../management.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFoldersDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
}
export function createDriveFoldersProcedure(deps: DriveFoldersDependencies) {
	return implement(driveManagementContract['drive/folders'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/folders', 'requireCredential': true, 'kind': 'read:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
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
		});
}
