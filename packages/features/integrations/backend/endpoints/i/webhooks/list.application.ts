/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { iWebhooksListInput, iWebhooksListOutput } from './list.contract.js';

@Injectable()
export class IWebhooksListApplicationService {
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
	) {}

	public async execute(_ps: v.InferOutput<typeof iWebhooksListInput>, me: MiUser): Promise<v.InferOutput<typeof iWebhooksListOutput>> {
		const result = await (async () => {
			const webhooks = await this.webhooksRepository.findBy({
				userId: me.id,
			});

			return webhooks.map(webhook => ({
				id: webhook.id,
				userId: webhook.userId,
				name: webhook.name,
				on: webhook.on,
				url: webhook.url,
				secret: webhook.secret,
				active: webhook.active,
				latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
				latestStatus: webhook.latestStatus,
			}));
		})();
		return v.parse(iWebhooksListOutput, result);
	}
}
