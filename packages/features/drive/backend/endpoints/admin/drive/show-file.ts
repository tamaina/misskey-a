/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { toRequestHeaders } from '../../../management.schema.js';
import { adminDriveShowFileErrors } from './show-file.contract.js';
import type { DriveFileSelectorRepository } from '../../../selector.repository.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { driveManagementContract } from '../../../api.definition.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

export interface AdminDriveShowFileDependencies {
	driveFileSelectorRepository: DriveFileSelectorRepository;
	usersRepository: UsersRepository;
	roleService: Pick<RoleService, 'isModerator'>;
	idService: Pick<IdService, 'parse'>;
}
export function createAdminDriveShowFileProcedure(deps: AdminDriveShowFileDependencies) {
	return createApiProcedure<MiLocalUser>()(driveManagementContract['admin/drive/show-file']).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const _ip = context.ip;
			const _headers = context.headers;
			const file = await deps.driveFileSelectorRepository.findOneBy(
				ps.fileId !== undefined
					? { id: ps.fileId }
					: [{ url: ps.url }, { thumbnailUrl: ps.url }, { webpublicUrl: ps.url }],
			);

			if (file == null) {
				throw apiError(adminDriveShowFileErrors.noSuchFile);
			}

			const owner = file.userId ? await deps.usersRepository.findOneByOrFail({
				id: file.userId,
			}) : null;

			const iAmModerator = await deps.roleService.isModerator(me);
			const ownerIsModerator = owner ? await deps.roleService.isModerator(owner) : false;

			return {
				id: file.id,
				userId: file.userId,
				userHost: file.userHost,
				isLink: file.isLink,
				maybePorn: file.maybePorn,
				maybeSensitive: file.maybeSensitive,
				isSensitive: file.isSensitive,
				folderId: file.folderId,
				src: file.src,
				uri: file.uri,
				webpublicAccessKey: file.webpublicAccessKey,
				thumbnailAccessKey: file.thumbnailAccessKey,
				accessKey: file.accessKey,
				webpublicType: file.webpublicType,
				webpublicUrl: file.webpublicUrl,
				thumbnailUrl: file.thumbnailUrl,
				url: file.url,
				storedInternal: file.storedInternal,
				properties: {
					width: file.properties.width,
					height: file.properties.height,
					orientation: file.properties.orientation,
					avgColor: file.properties.avgColor,
				},
				blurhash: file.blurhash,
				comment: file.comment,
				size: file.size,
				type: file.type,
				name: file.name,
				md5: file.md5,
				createdAt: deps.idService.parse(file.id).date.toISOString(),
				requestIp: iAmModerator ? file.requestIp : null,
				requestHeaders: iAmModerator && !ownerIsModerator ? toRequestHeaders(file.requestHeaders) : null,
			};
		});
}
