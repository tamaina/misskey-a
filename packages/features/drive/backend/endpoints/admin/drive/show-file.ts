/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementInputs } from '../../../management.contract.js';
import { toRequestHeaders } from '../../../management.schema.js';
import { adminDriveShowFileErrors } from './show-file.contract.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFileSelectorRepository } from '../../../selector.repository.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';

@Injectable()
export class AdminDriveShowFileOperation {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFileSelectorRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
	}

	async execute(ps: DriveManagementInputs['admin/drive/show-file'], me: MiLocalUser, _ip: string, _headers: Record<string, string | string[] | undefined>) {
		const file = await this.driveFilesRepository.findOneBy(
			ps.fileId !== undefined
				? { id: ps.fileId }
				: [{ url: ps.url }, { thumbnailUrl: ps.url }, { webpublicUrl: ps.url }],
		);

		if (file == null) {
			throw apiError(adminDriveShowFileErrors.noSuchFile);
		}

		const owner = file.userId ? await this.usersRepository.findOneByOrFail({
			id: file.userId,
		}) : null;

		const iAmModerator = await this.roleService.isModerator(me);
		const ownerIsModerator = owner ? await this.roleService.isModerator(owner) : false;

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
			properties: file.properties,
			blurhash: file.blurhash,
			comment: file.comment,
			size: file.size,
			type: file.type,
			name: file.name,
			md5: file.md5,
			createdAt: this.idService.parse(file.id).date.toISOString(),
			requestIp: iAmModerator ? file.requestIp : null,
			requestHeaders: iAmModerator && !ownerIsModerator ? toRequestHeaders(file.requestHeaders) : null,
		};
	}
}
