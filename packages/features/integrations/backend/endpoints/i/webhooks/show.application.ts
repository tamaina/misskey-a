/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { iWebhooksShowInput, iWebhooksShowOutput, iWebhooksShowErrors } from './show.contract.js';

@Injectable()
export class IWebhooksShowApplicationService {
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
	) {}

	public async execute(ps: v.InferOutput<typeof iWebhooksShowInput>, me: MiUser): Promise<v.InferOutput<typeof iWebhooksShowOutput>> {
		const result = await (async () => {
			const webhook = await this.webhooksRepository.findOneBy({
				id: ps.webhookId,
				userId: me.id,
			});

			if (webhook == null) {
				throw apiError(iWebhooksShowErrors.noSuchWebhook);
			}

			return {
				id: webhook.id,
				userId: webhook.userId,
				name: webhook.name,
				on: webhook.on,
				url: webhook.url,
				secret: webhook.secret,
				active: webhook.active,
				latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
				latestStatus: webhook.latestStatus,
			};
		})();
		return v.parse(iWebhooksShowOutput, result);
	}
}
