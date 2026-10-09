/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import type { AdminQueuePauseInput } from './pause.contract.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueuePauseApplicationService {
	constructor(private queueService: QueueService, private moderationLogService: ModerationLogService) {}

	public async execute(ps: AdminQueuePauseInput, me: MiUser): Promise<void> {
		await this.queueService.queuePause(ps.queue);
		void this.moderationLogService.log(me, 'pauseQueue');
	}
}
