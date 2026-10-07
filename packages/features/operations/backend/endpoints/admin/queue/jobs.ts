/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { referenceAdminQueueJobsDefinition, referenceAdminQueueJobsInput, referenceAdminQueueJobsOutput } from '../../../../contract/reference-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';

const contractProjection = projectEndpointContract(referenceAdminQueueJobsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof referenceAdminQueueJobsInput, typeof referenceAdminQueueJobsOutput> {
	constructor(
		private queueService: QueueService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return this.queueService.queueGetJobs(ps.queue, ps.state, ps.search);
		});
	}
}
