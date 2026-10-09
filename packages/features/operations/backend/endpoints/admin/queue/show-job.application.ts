/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueShowJobInput, AdminQueueShowJobOutput } from './show-job.contract.js';
import { adminQueueShowJobContract } from './show-job.contract.js';

@Injectable()
export class AdminQueueShowJobApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: AdminQueueShowJobInput, _me: MiUser): Promise<AdminQueueShowJobOutput> {
		const result = await (async () => {
			return this.queueService.queueGetJob(ps.queue, ps.jobId);
		})();
		return v.parse(adminQueueShowJobContract['~orpc'].outputSchema!, result);
	}
}
