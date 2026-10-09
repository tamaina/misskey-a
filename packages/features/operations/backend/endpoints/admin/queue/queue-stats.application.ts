/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueQueueStatsInput, AdminQueueQueueStatsOutput } from './queue-stats.contract.js';
import { adminQueueQueueStatsContract } from './queue-stats.contract.js';

@Injectable()
export class AdminQueueQueueStatsApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: AdminQueueQueueStatsInput, _me: MiUser): Promise<AdminQueueQueueStatsOutput> {
		const result = await (async () => {
			return this.queueService.queueGetQueue(ps.queue);
		})();
		return v.parse(adminQueueQueueStatsContract['~orpc'].outputSchema!, result);
	}
}
