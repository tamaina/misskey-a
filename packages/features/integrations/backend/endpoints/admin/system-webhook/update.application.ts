/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookUpdateContract } from './update.contract.js';

@Injectable()
export class AdminSystemWebhookUpdateApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof adminSystemWebhookUpdateContract['~orpc']['inputSchema']>>, me: MiUser): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookUpdateContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			const result = await this.systemWebhookService.updateSystemWebhook(
				{
					id: ps.id,
					isActive: ps.isActive,
					name: ps.name,
					on: ps.on,
					url: ps.url,
					secret: ps.secret,
				},
				me,
			);

			return this.systemWebhookEntityService.pack(result);
		})();
		return v.parse(requiredSchema(adminSystemWebhookUpdateContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
