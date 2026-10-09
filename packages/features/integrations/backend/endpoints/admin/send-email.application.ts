/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { EmailService } from '../../../../email/backend/services/EmailService.js';
import type { MiUser } from '../../../../users/backend/models/User.js';
import * as v from 'valibot';
import { adminSendEmailContract } from './send-email.contract.js';

@Injectable()
export class AdminSendEmailApplicationService {
	constructor(
		private emailService: EmailService,
	) {}

	public async execute(ps: v.InferOutput<NonNullable<typeof adminSendEmailContract['~orpc']['inputSchema']>>, _me: MiUser): Promise<v.InferOutput<NonNullable<typeof adminSendEmailContract['~orpc']['outputSchema']>>> {
		const result = await (async () => {
			await this.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
		})();
		return v.parse(requiredSchema(adminSendEmailContract['~orpc'].outputSchema), result);
	}
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Contract must declare its schema');
	return schema;
}
