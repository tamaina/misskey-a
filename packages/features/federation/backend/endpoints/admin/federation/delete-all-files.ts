/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { adminFederationDeleteAllFilesContract } from './delete-all-files.contract.js';
import type { DriveFilesRepository } from '../../../../../persistence/backend/repositories/models.js';
import type { DriveService } from '../../../../../drive/backend/services/DriveService.js';
import * as v from 'valibot';
export interface AdminFederationDeleteAllFilesDependencies {
	driveFilesRepository: Pick<DriveFilesRepository, 'findBy'>;
	driveService: Pick<DriveService, 'deleteFile'>;
}
export function createAdminFederationDeleteAllFilesProcedure<Actor extends ApiActor>(deps: AdminFederationDeleteAllFilesDependencies) {
	return implement(adminFederationDeleteAllFilesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: adminFederationDeleteAllFilesContract['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
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
			return v.parse(adminFederationDeleteAllFilesContract['~orpc'].outputSchema!, result);
		});
}
