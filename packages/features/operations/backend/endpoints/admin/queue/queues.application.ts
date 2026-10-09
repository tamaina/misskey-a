/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { QueueService } from '../../../../../runtime/backend/services/QueueService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import type { AdminQueueQueuesInput, AdminQueueQueuesOutput } from './queues.contract.js';
import { adminQueueQueuesContract } from './queues.contract.js';

@Injectable()
export class AdminQueueQueuesApplicationService {
	constructor(
		private queueService: QueueService,
	) {}

	public async execute(_ps: AdminQueueQueuesInput, _me: MiUser): Promise<AdminQueueQueuesOutput> {
		const result = await (async () => {
			return this.queueService.queueGetQueues();
		})();
		return v.parse(adminQueueQueuesContract['~orpc'].outputSchema!, result);
	}
}
