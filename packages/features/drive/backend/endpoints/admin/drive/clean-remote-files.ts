/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminDriveCleanRemoteFilesDefinition, voidAdminDriveCleanRemoteFilesInput, voidAdminDriveCleanRemoteFilesOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { QueueService } from '@features/runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(voidAdminDriveCleanRemoteFilesDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:drive',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminDriveCleanRemoteFilesInput, typeof voidAdminDriveCleanRemoteFilesOutput> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			this.queueService.createCleanRemoteFilesJob();
		});
	}
}
