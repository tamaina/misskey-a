/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueShowJobInput, adminQueueShowJobOutput } from './show-job.contract.js';

@Injectable()
export class AdminQueueShowJobApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminQueueShowJobInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueShowJobOutput>> {
		const result = await (async () => {
			return this.queueService.queueGetJob(ps.queue, ps.jobId);
		})();
		return v.parse(adminQueueShowJobOutput, result);
	}
}
