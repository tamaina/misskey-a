/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import type { DeliverQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueDeliverDelayedInput, AdminQueueDeliverDelayedOutput } from './deliver-delayed.contract.js';
import { adminQueueDeliverDelayedContract } from './deliver-delayed.contract.js';

@Injectable()
export class AdminQueueDeliverDelayedApplicationService {
	constructor(
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
	) {}

	public async execute(_ps: AdminQueueDeliverDelayedInput, _me: MiUser): Promise<AdminQueueDeliverDelayedOutput> {
		const result = await (async () => {
			const jobs = await this.deliverQueue.getJobs(['delayed']);

			const counts = new Map<string, number>();

			for (const job of jobs) {
				const host = new URL(job.data.to).host;
				counts.set(host, (counts.get(host) ?? 0) + 1);
			}

			const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);

			return res;
		})();
		return v.parse(adminQueueDeliverDelayedContract['~orpc'].outputSchema!, result);
	}
}
