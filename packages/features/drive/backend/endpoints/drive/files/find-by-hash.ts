/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFilesFindByHashDefinition, packedDriveFilesFindByHashInput, packedDriveFilesFindByHashOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/_.js';

import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedDriveFilesFindByHashDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Search for a drive file by a hash of the contents.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFilesFindByHashInput, typeof packedDriveFilesFindByHashOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				md5: ps.md5,
				userId: me.id,
			});

			return await this.driveFileEntityService.packMany(files, { self: true });
		});
	}
}
