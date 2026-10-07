/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminFederationDeleteAllFilesDefinition, voidAdminFederationDeleteAllFilesInput, voidAdminFederationDeleteAllFilesOutput } from '../../../../../../../features/federation/contract/void-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';

import type { DriveFilesRepository } from '@/models/_.js';
import { DriveService } from '../../../../../../../features/drive/backend/services/DriveService.js';
import { DI } from '@/di-symbols.js';

const contractProjection = projectEndpointContract(voidAdminFederationDeleteAllFilesDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:federation',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof voidAdminFederationDeleteAllFilesInput, typeof voidAdminFederationDeleteAllFilesOutput> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				userHost: ps.host,
			});

			for (const file of files) {
				this.driveService.deleteFile(file);
			}
		});
	}
}
