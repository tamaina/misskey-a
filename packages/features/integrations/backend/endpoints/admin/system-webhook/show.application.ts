/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookShowErrors, adminSystemWebhookShowContract } from './show.contract.js';

@Injectable()
export class AdminSystemWebhookShowApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof adminSystemWebhookShowContract['~orpc']['inputSchema']>>, _me: MiUser): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookShowContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			const webhooks = await this.systemWebhookService.fetchSystemWebhooks({ ids: [ps.id] });
			if (webhooks.length === 0) {
				throw apiError(adminSystemWebhookShowErrors.noSuchSystemWebhook);
			}

			return this.systemWebhookEntityService.pack(webhooks[0]);
		})();
		return v.parse(requiredSchema(adminSystemWebhookShowContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
