/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { uniqueDriveFilesMoveBulkDefinition, uniqueDriveFilesMoveBulkInput, uniqueDriveFilesMoveBulkOutput } from '../../../../contract/unique-string-endpoint-definitions.js';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { DriveService } from '../../../services/DriveService.js';
import { ApiError } from '@/server/api/error.js';

const contractProjection = projectEndpointContract(uniqueDriveFilesMoveBulkDefinition);

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof uniqueDriveFilesMoveBulkInput, typeof uniqueDriveFilesMoveBulkOutput> {
	constructor(
		private driveService: DriveService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.driveService.moveFiles(ps.fileIds, ps.folderId ?? null, me.id);
		});
	}
}
