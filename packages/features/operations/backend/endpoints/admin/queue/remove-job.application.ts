/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { AdminQueueRemoveJobInput } from './remove-job.contract.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueueRemoveJobApplicationService {
	constructor(private queueService: QueueService) {}

	public async execute(ps: AdminQueueRemoveJobInput, _me: MiUser): Promise<void> {
		void this.queueService.queueRemoveJob(ps.queue, ps.jobId);
	}
}
