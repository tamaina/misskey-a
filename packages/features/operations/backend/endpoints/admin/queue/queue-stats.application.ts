/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueQueueStatsInput, adminQueueQueueStatsOutput } from './queue-stats.contract.js';

@Injectable()
export class AdminQueueQueueStatsApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminQueueQueueStatsInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueQueueStatsOutput>> {
		const result = await (async () => {
			return this.queueService.queueGetQueue(ps.queue);
		})();
		return v.parse(adminQueueQueueStatsOutput, result);
	}
}
