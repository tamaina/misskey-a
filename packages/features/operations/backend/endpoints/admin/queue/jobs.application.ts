/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueJobsInput, adminQueueJobsOutput } from './jobs.contract.js';

@Injectable()
export class AdminQueueJobsApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminQueueJobsInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueJobsOutput>> {
		const result = await (async () => {
			return this.queueService.queueGetJobs(ps.queue, ps.state, ps.search);
		})();
		return v.parse(adminQueueJobsOutput, result);
	}
}
