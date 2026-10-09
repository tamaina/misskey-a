/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookTestInput, adminSystemWebhookTestOutput, adminSystemWebhookTestErrors } from './test.contract.js';

@Injectable()
export class AdminSystemWebhookTestApplicationService {
	constructor(
		private webhookTestService: WebhookTestService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminSystemWebhookTestInput>, _me: MiUser): Promise<v.InferOutput<typeof adminSystemWebhookTestOutput>> {
		const result = await (async () => {
			try {
				await this.webhookTestService.testSystemWebhook({
					webhookId: ps.webhookId,
					type: ps.type,
					override: ps.override,
				});
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchWebhookError) {
					throw apiError(adminSystemWebhookTestErrors.noSuchWebhook);
				}
				throw e;
			}
		})();
		return v.parse(adminSystemWebhookTestOutput, result);
	}
}
