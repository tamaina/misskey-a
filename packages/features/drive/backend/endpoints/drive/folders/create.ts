/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiDriveFolder } from '../../../models/DriveFolder.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { driveFoldersCreateErrors } from './create.contract.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFoldersCreateDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
	idService: Pick<IdService, 'gen'>;
	globalEventService: Pick<GlobalEventService, 'publishDriveStream'>;
}
export function createDriveFoldersCreateProcedure(deps: DriveFoldersCreateDependencies) {
	return implement(driveManagementContract['drive/folders/create'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/folders/create', 'requireCredential': true, 'kind': 'write:drive', 'limit': { 'duration': 3600000, 'max': 10 } })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
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
		});
}
