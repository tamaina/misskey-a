/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { delayedTupleAdminQueueInboxDelayedDefinition, delayedTupleAdminQueueInboxDelayedInput, delayedTupleAdminQueueInboxDelayedOutput } from '../../../../contract/delayed-tuple-endpoint-definitions.js';
import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import type { InboxQueue } from '@/core/QueueModule.js';

const contractProjection = projectEndpointContract(delayedTupleAdminQueueInboxDelayedDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof delayedTupleAdminQueueInboxDelayedInput, typeof delayedTupleAdminQueueInboxDelayedOutput> {
	constructor(
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const jobs = await this.inboxQueue.getJobs(['delayed']);

			const counts = new Map<string, number>();

			for (const job of jobs) {
				const host = new URL(job.data.signature.keyId).host;
				counts.set(host, (counts.get(host) ?? 0) + 1);
			}

			const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);

			return res;
		});
	}
}
