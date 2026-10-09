/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { EmailService } from '@features/email/backend/services/EmailService.js';

import * as v from 'valibot';
import { inlineEmailAddressAvailableInput } from '../../auth.schema.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,
} as const;

@Injectable()
export class EmailAddressAvailableOperation {
	constructor(
		private emailService: EmailService,
	) {}

	async execute(ps: v.InferOutput<typeof inlineEmailAddressAvailableInput>, me: MiLocalUser | null) {
		return await this.emailService.validateEmailForAccount(ps.emailAddress);
	}
}
