/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminQueueQueuesInput, adminQueueQueuesOutput } from './queues.contract.js';

@Injectable()
export class AdminQueueQueuesApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(_ps: v.InferOutput<typeof adminQueueQueuesInput>, _me: MiUser): Promise<v.InferOutput<typeof adminQueueQueuesOutput>> {
		const result = await (async () => {
			return this.queueService.queueGetQueues();
		})();
		return v.parse(adminQueueQueuesOutput, result);
	}
}
