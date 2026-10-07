/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '../../index/backend/service-definitions.js';
import { ports } from '../../index/backend/service-ports.js';
import { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';
import type { Inputs, Outputs } from '../../index/backend/service-definitions.js';

export const driveServices = defineServices({
	DriveFolderEntityService: service(DriveFolderEntityService, [ports.driveFoldersRepository, ports.driveFilesRepository, ports.idService]),
});
export const createDriveServices = driveServices.create;
export type DriveServicesDependencies = Inputs<typeof driveServices>;
export type DriveServices = Outputs<typeof driveServices>;
