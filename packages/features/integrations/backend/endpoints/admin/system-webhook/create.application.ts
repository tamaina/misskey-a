/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookEntityService } from '../../../serializers/SystemWebhookEntityService.js';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookCreateInput, adminSystemWebhookCreateOutput } from './create.contract.js';

@Injectable()
export class AdminSystemWebhookCreateApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminSystemWebhookCreateInput>, me: MiUser): Promise<v.InferOutput<typeof adminSystemWebhookCreateOutput>> {
		const result = await (async () => {
			const result = await this.systemWebhookService.createSystemWebhook(
				{
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
		return v.parse(adminSystemWebhookCreateOutput, result);
	}
}
