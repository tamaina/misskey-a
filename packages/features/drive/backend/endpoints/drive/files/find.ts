/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFilesFindDefinition, packedDriveFilesFindInput, packedDriveFilesFindOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFileEntityService } from '../../../serializers/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedDriveFilesFindDefinition);

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

	description: 'Search for a drive file by the given parameters.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFilesFindInput, typeof packedDriveFilesFindOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				name: ps.name,
				userId: me.id,
				folderId: ps.folderId ?? IsNull(),
			});

			return await this.driveFileEntityService.packMany(files, { self: true });
		});
	}
}
