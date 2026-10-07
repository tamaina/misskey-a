/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';
import type { DriveFilesRepository, DriveFoldersRepository } from '@/models/_.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';

export interface DriveServicesDependencies {
	driveFoldersRepository: DriveFoldersRepository;
	driveFilesRepository: DriveFilesRepository;
	idService: Pick<IdService, 'parse'>;
}

/** Compose this feature without starting resources or resolving a container. */
export function createDriveServices(deps: DriveServicesDependencies) {
	const driveFolderEntityService = new DriveFolderEntityService(deps.driveFoldersRepository, deps.driveFilesRepository, deps.idService);

	return {
		DriveFolderEntityService: driveFolderEntityService,
	};
}

export type DriveServices = ReturnType<typeof createDriveServices>;
