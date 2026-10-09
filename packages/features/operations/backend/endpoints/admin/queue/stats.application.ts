/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DbQueue, DeliverQueue, EndedPollNotificationQueue, PostScheduledNoteQueue, InboxQueue, ObjectStorageQueue, SystemQueue, UserWebhookDeliverQueue, SystemWebhookDeliverQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueStatsInput, AdminQueueStatsOutput } from './stats.contract.js';
import { adminQueueStatsContract } from './stats.contract.js';

@Injectable()
export class AdminQueueStatsApplicationService {
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
	) {}

	public async execute(_ps: AdminQueueStatsInput, _me: MiUser): Promise<AdminQueueStatsOutput> {
		const result = await (async () => {
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
		})();
		return v.parse(adminQueueStatsContract['~orpc'].outputSchema!, result);
	}
}
