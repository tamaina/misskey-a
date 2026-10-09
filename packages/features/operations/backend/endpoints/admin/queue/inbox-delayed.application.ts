/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import type { InboxQueue } from '../../../../../boot/backend/assembly/QueueModule.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueInboxDelayedInput, adminQueueInboxDelayedOutput } from './inbox-delayed.contract.js';

@Injectable()
export class AdminQueueInboxDelayedApplicationService {
	constructor(
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
	) {}

	public async execute(_ps: v.InferOutput<typeof adminQueueInboxDelayedInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueInboxDelayedOutput>> {
		const result = await (async () => {
			const jobs = await this.inboxQueue.getJobs(['delayed']);

			const counts = new Map<string, number>();

			for (const job of jobs) {
				const host = new URL(job.data.signature.keyId).host;
				counts.set(host, (counts.get(host) ?? 0) + 1);
			}

			const res = [...counts.entries()].sort((a, b) => b[1] - a[1]);

			return res;
		})();
		return v.parse(adminQueueInboxDelayedOutput, result);
	}
}
