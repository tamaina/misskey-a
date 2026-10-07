/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminDeleteAllFilesOfAUserDefinition, voidAdminDeleteAllFilesOfAUserInput, voidAdminDeleteAllFilesOfAUserOutput } from '../../../contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@/models/_.js';
import { DriveService } from '../../services/DriveService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidAdminDeleteAllFilesOfAUserDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:delete-all-files-of-a-user',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminDeleteAllFilesOfAUserInput, typeof voidAdminDeleteAllFilesOfAUserOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				userId: ps.userId,
			});

			for (const file of files) {
				this.driveService.deleteFile(file);
			}
		});
	}
}
