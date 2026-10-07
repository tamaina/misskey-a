/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineTestDefinition, inlineTestInput, inlineTestOutput } from '../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

const contractProjection = projectEndpointContract(inlineTestDefinition);

export const meta = {
	tags: ['non-productive'],

	description: 'Endpoint for testing input validation.',

	requireCredential: false,

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineTestInput, typeof inlineTestOutput> {
	constructor(
	) {
		super(meta, contractProjection, async (ps, me) => {
			return ps;
		});
	}
}
