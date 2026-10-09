/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { WebhookTestService } from '../../../services/WebhookTestService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { iWebhooksTestInput, iWebhooksTestOutput, iWebhooksTestErrors } from './test.contract.js';

@Injectable()
export class IWebhooksTestApplicationService {
	constructor(
		private webhookTestService: WebhookTestService,
	) {}

	public async execute(ps: v.InferOutput<typeof iWebhooksTestInput>, me: MiUser): Promise<v.InferOutput<typeof iWebhooksTestOutput>> {
		const result = await (async () => {
			try {
				await this.webhookTestService.testUserWebhook({
					webhookId: ps.webhookId,
					type: ps.type,
					override: ps.override,
				}, me);
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchWebhookError) {
					throw apiError(iWebhooksTestErrors.noSuchWebhook);
				}
				throw e;
			}
		})();
		return v.parse(iWebhooksTestOutput, result);
	}
}
