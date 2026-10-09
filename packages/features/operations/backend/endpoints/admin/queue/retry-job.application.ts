/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { AdminQueueRetryJobInput } from './retry-job.contract.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueueRetryJobApplicationService {
	constructor(private queueService: QueueService) {}

	public async execute(ps: AdminQueueRetryJobInput, _me: MiUser): Promise<void> {
		void this.queueService.queueRetryJob(ps.queue, ps.jobId);
	}
}
