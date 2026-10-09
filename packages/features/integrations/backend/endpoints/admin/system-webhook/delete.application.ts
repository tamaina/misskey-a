/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookDeleteContract } from './delete.contract.js';

@Injectable()
export class AdminSystemWebhookDeleteApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof adminSystemWebhookDeleteContract['~orpc']['inputSchema']>>, me: MiUser): Promise<v.InferOutput<NonNullable<typeof adminSystemWebhookDeleteContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			await this.systemWebhookService.deleteSystemWebhook(
				ps.id,
				me,
			);
		})();
		return v.parse(requiredSchema(adminSystemWebhookDeleteContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
