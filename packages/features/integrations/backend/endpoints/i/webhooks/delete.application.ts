/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { iWebhooksDeleteErrors, type iWebhooksDeleteContract } from './delete.contract.js';
import type * as v from 'valibot';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class IWebhooksDeleteApplicationService {
	constructor(@Inject(DI.webhooksRepository) private webhooksRepository: WebhooksRepository, private globalEventService: GlobalEventService) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof iWebhooksDeleteContract['~orpc']['inputSchema']>>, me: MiUser): Promise<void> {
		const webhook = await this.webhooksRepository.findOneBy({ id: ps.webhookId, userId: me.id });
		if (webhook === null) throw apiError(iWebhooksDeleteErrors.noSuchWebhook);
		await this.webhooksRepository.delete(webhook.id);
		void this.globalEventService.publishInternalEvent('webhookDeleted', webhook);
	}
}
