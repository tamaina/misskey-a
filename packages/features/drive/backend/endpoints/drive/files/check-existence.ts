/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineDriveFilesCheckExistenceDefinition, inlineDriveFilesCheckExistenceInput, inlineDriveFilesCheckExistenceOutput } from '../../../../contract/endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(inlineDriveFilesCheckExistenceDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Check if a given file exists.',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineDriveFilesCheckExistenceInput, typeof inlineDriveFilesCheckExistenceOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const exist = await this.driveFilesRepository.exists({
				where: {
					md5: ps.md5,
					userId: me.id,
				},
			});

			return exist;
		});
	}
}
