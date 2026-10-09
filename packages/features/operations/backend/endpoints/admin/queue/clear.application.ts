/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import { ModerationLogService } from '../../../../../moderation/backend/services/ModerationLogService.js';
import type { AdminQueueClearInput } from './clear.contract.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class AdminQueueClearApplicationService {
	constructor(private queueService: QueueService, private moderationLogService: ModerationLogService) {}

	public async execute(ps: AdminQueueClearInput, me: MiUser): Promise<void> {
		void this.queueService.queueClear(ps.queue, ps.state);
		void this.moderationLogService.log(me, 'clearQueue');
	}
}
