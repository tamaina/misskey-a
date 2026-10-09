/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueShowJobLogsInput, AdminQueueShowJobLogsOutput } from './show-job-logs.contract.js';
import { adminQueueShowJobLogsContract } from './show-job-logs.contract.js';

@Injectable()
export class AdminQueueShowJobLogsApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: AdminQueueShowJobLogsInput, _me: MiUser): Promise<AdminQueueShowJobLogsOutput> {
		const result = await (async () => {
			return this.queueService.queueGetJobLogs(ps.queue, ps.jobId);
		})();
		return v.parse(adminQueueShowJobLogsContract['~orpc'].outputSchema!, result);
	}
}
