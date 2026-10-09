/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookListInput, adminSystemWebhookListOutput } from './list.contract.js';

@Injectable()
export class AdminSystemWebhookListApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminSystemWebhookListInput>, _me: MiUser): Promise<v.InferOutput<typeof adminSystemWebhookListOutput>> {
		const result = await (async () => {
			const webhooks = await this.systemWebhookService.fetchSystemWebhooks({
				isActive: ps.isActive,
				on: ps.on,
			});
			return this.systemWebhookEntityService.packMany(webhooks);
		})();
		return v.parse(adminSystemWebhookListOutput, result);
	}
}
