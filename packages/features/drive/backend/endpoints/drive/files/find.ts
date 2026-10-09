/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { IsNull } from 'typeorm';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { driveManagementContract } from '../../../api.definition.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface DriveFilesFindDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveFileEntityService: Pick<DriveFileEntityService, 'packMany'>;
}
export function createDriveFilesFindProcedure(deps: DriveFilesFindDependencies) {
	return implement(driveManagementContract['drive/files/find'], { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ 'name': 'drive/files/find', 'requireCredential': true, 'kind': 'read:drive' })).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const files = await deps.driveFilesRepository.findBy({
				name: ps.name,
				userId: me.id,
				folderId: ps.folderId ?? IsNull(),
			});

			return await deps.driveFileEntityService.packMany(files, { self: true });
		});
}
