/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminDriveCleanupDefinition, voidAdminDriveCleanupInput, voidAdminDriveCleanupOutput } from '../../../../contract/void-endpoint-definitions.js';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@/models/_.js';
import { DriveService } from '../../../services/DriveService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidAdminDriveCleanupDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:drive',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminDriveCleanupInput, typeof voidAdminDriveCleanupOutput> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				userId: IsNull(),
			});

			for (const file of files) {
				this.driveService.deleteFile(file);
			}
		});
	}
}
