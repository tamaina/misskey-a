/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '../../../../../runtime/backend/services/IdService.js';
import type { WebhooksRepository } from '../../../../../persistence/backend/repositories/models.js';
import { GlobalEventService } from '../../../../../runtime/backend/services/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '../../../../../roles/backend/services/RoleService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { iWebhooksCreateErrors, iWebhooksCreateContract } from './create.contract.js';

@Injectable()
export class IWebhooksCreateApplicationService {
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private roleService: RoleService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof iWebhooksCreateContract['~orpc']['inputSchema']>>, me: MiUser): Promise<v.InferOutput<NonNullable<typeof iWebhooksCreateContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			const currentWebhooksCount = await this.webhooksRepository.countBy({
				userId: me.id,
			});
			if (currentWebhooksCount >= (await this.roleService.getUserPolicies(me.id)).webhookLimit) {
				throw apiError(iWebhooksCreateErrors.tooManyWebhooks);
			}

			const webhook = await this.webhooksRepository.insertOne({
				id: this.idService.gen(),
				userId: me.id,
				name: ps.name,
				url: ps.url,
				secret: ps.secret,
				on: ps.on,
			});

			this.globalEventService.publishInternalEvent('webhookCreated', webhook);

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
		return v.parse(requiredSchema(iWebhooksCreateContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
