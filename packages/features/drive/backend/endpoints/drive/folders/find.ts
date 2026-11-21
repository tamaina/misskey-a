/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFolder } from '@features/notes/backend/drive.schema.js';
import { IsNull } from 'typeorm';

import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersFindDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
}
export function createDriveFoldersFindProcedure(deps: DriveFoldersFindDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders/find']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				const folders = await deps.driveFoldersRepository.findBy({
					name: ps.name,
					userId: me.id,
					parentId: ps.parentId ?? IsNull(),
				});

				return await Promise.all(folders.map(folder => deps.driveFolderEntityService.pack(folder)));
			})();
			return result.map(toPackedDriveFolder);
		});
}
