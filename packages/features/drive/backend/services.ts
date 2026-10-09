/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineServices, service } from '@features/index/backend/service-definitions.js';
import { ports } from '@features/index/backend/service-ports.js';
import { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';

export const driveServices = defineServices({
	DriveFolderEntityService: service(DriveFolderEntityService, [ports.driveFoldersRepository, ports.driveFilesRepository, ports.idService]),
});
