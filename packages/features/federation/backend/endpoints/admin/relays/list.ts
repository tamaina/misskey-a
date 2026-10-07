/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@/server/api/contract-endpoint.js';
import { inlineAdminRelaysListDefinition, inlineAdminRelaysListInput, inlineAdminRelaysListOutput } from '../../../../contract/endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { RelayService } from '../../../services/RelayService.js';

const contractProjection = projectEndpointContract(inlineAdminRelaysListDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:relays',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof inlineAdminRelaysListInput, typeof inlineAdminRelaysListOutput> {
	constructor(
		private relayService: RelayService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.relayService.listRelay();
		});
	}
}
