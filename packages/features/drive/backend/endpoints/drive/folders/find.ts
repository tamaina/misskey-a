/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedDriveFoldersFindDefinition, packedDriveFoldersFindInput, packedDriveFoldersFindOutput } from '../../../../contract/packed-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import type { DriveFoldersRepository } from '@/models/_.js';
import { DriveFolderEntityService } from '../../../serializers/DriveFolderEntityService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(packedDriveFoldersFindDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof packedDriveFoldersFindInput, typeof packedDriveFoldersFindOutput> {
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const folders = await this.driveFoldersRepository.findBy({
				name: ps.name,
				userId: me.id,
				parentId: ps.parentId ?? IsNull(),
			});

			return await Promise.all(folders.map(folder => this.driveFolderEntityService.pack(folder)));
		});
	}
}
