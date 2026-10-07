/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { queueStatsDefinition, queueStatsInput, queueStatsOutput } from '../../../../contract/queue-stats-endpoint-definition.js';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, PostScheduledNoteQueue, InboxQueue, ObjectStorageQueue, SystemQueue, UserWebhookDeliverQueue, SystemWebhookDeliverQueue } from '@/core/QueueModule.js';

const contractProjection = projectEndpointContract(queueStatsDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:queue',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof queueStatsInput, typeof queueStatsOutput> {
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:postScheduledNote') public postScheduledNoteQueue: PostScheduledNoteQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const deliverJobCounts = await this.deliverQueue.getJobCounts();
			const inboxJobCounts = await this.inboxQueue.getJobCounts();
			const dbJobCounts = await this.dbQueue.getJobCounts();
			const objectStorageJobCounts = await this.objectStorageQueue.getJobCounts();

			return {
				deliver: deliverJobCounts,
				inbox: inboxJobCounts,
				db: dbJobCounts,
				objectStorage: objectStorageJobCounts,
			};
		});
	}
}
