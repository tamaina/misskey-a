/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import { adminQueueResumeInput } from './resume.contract.js';
import type * as v from 'valibot';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueueResumeApplicationService {
	constructor(private queueService: QueueService, private moderationLogService: ModerationLogService) {}

	public async execute(ps: v.InferOutput<typeof adminQueueResumeInput>, me: MiUser): Promise<void> {
		await this.queueService.queueResume(ps.queue);
		void this.moderationLogService.log(me, 'resumeQueue');
	}
}
