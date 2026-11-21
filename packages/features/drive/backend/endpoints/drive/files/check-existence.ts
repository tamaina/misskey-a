/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface DriveFilesCheckExistenceDependencies {
	driveFilesRepository: DriveFilesRepository;
}
export function createDriveFilesCheckExistenceProcedure(deps: DriveFilesCheckExistenceDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['drive/files/check-existence']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const exist = await deps.driveFilesRepository.exists({
				where: {
					md5: ps.md5,
					userId: me.id,
				},
			});

			return exist;
		});
}
