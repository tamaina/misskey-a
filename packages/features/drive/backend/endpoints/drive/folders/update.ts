/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toPackedDriveFolder } from '@features/notes/backend/drive.schema.js';
import { driveFoldersUpdateErrors } from './update.contract.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFoldersUpdateDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
	globalEventService: Pick<GlobalEventService, 'publishDriveStream'>;
}
export function createDriveFoldersUpdateProcedure(deps: DriveFoldersUpdateDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/folders/update']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const result = await (async () => {
				const ps = input;
				const me = context.principal;
				const _ip = context.ip;
				const _headers = context.headers;
				// Fetch folder
				const folder = await deps.driveFoldersRepository.findOneBy({
					id: ps.folderId,
					userId: me.id,
				});

				if (folder == null) {
					throw apiError(driveFoldersUpdateErrors.noSuchFolder);
				}

				if (ps.name) folder.name = ps.name;

				if (ps.parentId !== undefined) {
					if (ps.parentId === folder.id) {
						throw apiError(driveFoldersUpdateErrors.recursiveNesting);
					} else if (ps.parentId === null) {
						folder.parentId = null;
					} else {
						// Get parent folder
						const parent = await deps.driveFoldersRepository.findOneBy({
							id: ps.parentId,
							userId: me.id,
						});

						if (parent == null) {
							throw apiError(driveFoldersUpdateErrors.noSuchParentFolder);
						}

						// Check if the circular reference will occur
						const checkCircle = async (folderId: string): Promise<boolean> => {
							const folder2 = await deps.driveFoldersRepository.findOneByOrFail({
								id: folderId,
							});

							if (folder2.id === folder.id) {
								return true;
							} else if (folder2.parentId) {
								return await checkCircle(folder2.parentId);
							} else {
								return false;
							}
						};

						if (parent.parentId !== null) {
							if (await checkCircle(parent.parentId)) {
								throw apiError(driveFoldersUpdateErrors.recursiveNesting);
							}
						}

						folder.parentId = parent.id;
					}
				}

				// Update
				await deps.driveFoldersRepository.update(folder.id, {
					name: folder.name,
					parentId: folder.parentId,
				});

				const folderObj = await deps.driveFolderEntityService.pack(folder);

				// Publish folderUpdated event
				deps.globalEventService.publishDriveStream(me.id, 'folderUpdated', folderObj);

				return folderObj;
			})();
			return toPackedDriveFolder(result);
		});
}
