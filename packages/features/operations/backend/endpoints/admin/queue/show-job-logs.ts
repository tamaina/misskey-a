/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { constantAdminQueueShowJobLogsDefinition, constantAdminQueueShowJobLogsInput, constantAdminQueueShowJobLogsOutput } from '../../../../contract/source-constant-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(constantAdminQueueShowJobLogsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof constantAdminQueueShowJobLogsInput, typeof constantAdminQueueShowJobLogsOutput> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return this.queueService.queueGetJobLogs(ps.queue, ps.jobId);
		});
	}
}
