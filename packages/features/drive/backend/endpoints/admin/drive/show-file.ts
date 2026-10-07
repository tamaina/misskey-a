/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { selectorAdminDriveShowFileDefinition, selectorAdminDriveShowFileInput, selectorAdminDriveShowFileOutput } from '../../../../contract/selector-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(selectorAdminDriveShowFileDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:drive',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240',
		},
	},

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof selectorAdminDriveShowFileInput, typeof selectorAdminDriveShowFileOutput, 'legacy-declared'> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy(
				'fileId' in ps
					? { id: ps.fileId }
					: [{ url: ps.url }, { thumbnailUrl: ps.url }, { webpublicUrl: ps.url }],
			);

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
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
				requestHeaders: iAmModerator && !ownerIsModerator ? file.requestHeaders : null,
			};
		});
	}
}
