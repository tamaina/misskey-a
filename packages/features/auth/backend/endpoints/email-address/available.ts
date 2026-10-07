/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { inlineEmailAddressAvailableDefinition, inlineEmailAddressAvailableInput, inlineEmailAddressAvailableOutput } from '../../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { EmailService } from '@features/email/backend/services/EmailService.js';

const contractProjection = projectEndpointContract(inlineEmailAddressAvailableDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineEmailAddressAvailableInput, typeof inlineEmailAddressAvailableOutput> {
	constructor(
		private emailService: EmailService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.emailService.validateEmailForAccount(ps.emailAddress);
		});
	}
}
