/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueShowJobLogsInput, adminQueueShowJobLogsOutput } from './show-job-logs.contract.js';

@Injectable()
export class AdminQueueShowJobLogsApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminQueueShowJobLogsInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueShowJobLogsOutput>> {
		const result = await (async () => {
			return this.queueService.queueGetJobLogs(ps.queue, ps.jobId);
		})();
		return v.parse(adminQueueShowJobLogsOutput, result);
	}
}
