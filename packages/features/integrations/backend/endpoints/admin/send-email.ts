/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { voidAdminSendEmailDefinition, voidAdminSendEmailInput, voidAdminSendEmailOutput } from '../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { EmailService } from '@/core/EmailService.js';

const contractProjection = projectEndpointContract(voidAdminSendEmailDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:send-email',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export default class extends ContractEndpoint<typeof meta, typeof voidAdminSendEmailInput, typeof voidAdminSendEmailOutput> { // eslint-disable-line import/no-default-export
	constructor(
		private emailService: EmailService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			await this.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
		});
	}
}
