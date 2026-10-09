/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { SystemWebhookService } from '../../../services/SystemWebhookService.js';
import type { MiUser } from '../../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSystemWebhookDeleteInput, adminSystemWebhookDeleteOutput } from './delete.contract.js';

@Injectable()
export class AdminSystemWebhookDeleteApplicationService {
	constructor(
		private systemWebhookService: SystemWebhookService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminSystemWebhookDeleteInput>, me: MiUser): Promise<v.InferOutput<typeof adminSystemWebhookDeleteOutput>> {
		const result = await (async () => {
			await this.systemWebhookService.deleteSystemWebhook(
				ps.id,
				me,
			);
		})();
		return v.parse(adminSystemWebhookDeleteOutput, result);
	}
}
