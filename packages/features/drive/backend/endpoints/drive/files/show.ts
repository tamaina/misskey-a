/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { selectorDriveFilesShowDefinition, selectorDriveFilesShowInput, selectorDriveFilesShowOutput } from '../../../../contract/selector-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { MiDriveFile } from '../../../models/DriveFile.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { ApiError } from '@features/api/backend/transport/error.js';

const contractProjection = projectEndpointContract(selectorDriveFilesShowDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Show the properties of a drive file.',

	res: contractProjection.response,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '067bc436-2718-4795-b0fb-ecbe43949e31',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '25b73c73-68b1-41d0-bad1-381cfdf6579f',
		},
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof selectorDriveFilesShowInput, typeof selectorDriveFilesShowOutput, 'legacy-declared'> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy(
				'fileId' in ps
					? { id: ps.fileId }
					: [{ url: ps.url }, { webpublicUrl: ps.url }, { thumbnailUrl: ps.url }],
			);

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			return await this.driveFileEntityService.pack(file, {
				detail: true,
				withUser: true,
				self: true,
			});
		});
	}
}
