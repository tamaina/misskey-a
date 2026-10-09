/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import { adminQueuePromoteJobsInput } from './promote-jobs.contract.js';
import type * as v from 'valibot';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueuePromoteJobsApplicationService {
	constructor(private queueService: QueueService, private moderationLogService: ModerationLogService) {}

	public async execute(ps: v.InferOutput<typeof adminQueuePromoteJobsInput>, me: MiUser): Promise<void> {
		void this.queueService.queuePromoteJobs(ps.queue);
		void this.moderationLogService.log(me, 'promoteQueue');
	}
}
