/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import { adminFederationDeleteAllFilesContract } from './delete-all-files.contract.js';
import type { DriveFilesRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { DriveService } from '../../../../../drive/backend/services/DriveService.js';
export interface AdminFederationDeleteAllFilesDependencies {
	driveFilesRepository: Pick<DriveFilesRepository, 'findBy'>;
	driveService: Pick<DriveService, 'deleteFile'>;
}
export function createAdminFederationDeleteAllFilesProcedure<Actor extends ApiActor>(deps: AdminFederationDeleteAllFilesDependencies) {
	return createApiProcedure<Actor>()(adminFederationDeleteAllFilesContract)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const ps = input;
			const result = await (async () => {
				const files = await deps.driveFilesRepository.findBy({
					userHost: ps.host,
				});
				for (const file of files) {
					deps.driveService.deleteFile(file);
				}
			})();
			return result;
		});
}
