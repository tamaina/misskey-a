/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { iWebhooksUpdateInput, iWebhooksUpdateErrors } from './update.contract.js';
import type * as v from 'valibot';
import type { MiUser } from '../../../../../users/backend/models/User.js';

@Injectable()
export class IWebhooksUpdateApplicationService {
	constructor(@Inject(DI.webhooksRepository) private webhooksRepository: WebhooksRepository, private globalEventService: GlobalEventService) {}

	public async execute(ps: v.InferOutput<typeof iWebhooksUpdateInput>, me: MiUser): Promise<void> {
		const webhook = await this.webhooksRepository.findOneBy({ id: ps.webhookId, userId: me.id });
		if (webhook === null) throw apiError(iWebhooksUpdateErrors.noSuchWebhook);
		await this.webhooksRepository.update(webhook.id, { name: ps.name, url: ps.url, secret: ps.secret === null ? '' : ps.secret, on: ps.on, active: ps.active });
		const updated = await this.webhooksRepository.findOneByOrFail({ id: ps.webhookId });
		void this.globalEventService.publishInternalEvent('webhookUpdated', updated);
	}
}
