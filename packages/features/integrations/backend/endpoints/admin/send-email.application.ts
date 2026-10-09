/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { EmailService } from '../../../../email/backend/services/EmailService.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSendEmailInput, adminSendEmailOutput } from './send-email.contract.js';

@Injectable()
export class AdminSendEmailApplicationService {
	constructor(
		private emailService: EmailService,
	) {}

	public async execute(ps: v.InferOutput<typeof adminSendEmailInput>, _me: MiUser): Promise<v.InferOutput<typeof adminSendEmailOutput>> {
		const result = await (async () => {
			await this.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
		})();
		return v.parse(adminSendEmailOutput, result);
	}
}
