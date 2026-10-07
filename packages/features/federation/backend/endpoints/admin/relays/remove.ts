/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidAdminRelaysRemoveDefinition, voidAdminRelaysRemoveInput, voidAdminRelaysRemoveOutput } from '../../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { RelayService } from '../../../services/RelayService.js';

const contractProjection = projectEndpointContract(voidAdminRelaysRemoveDefinition);

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:relays',
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidAdminRelaysRemoveInput, typeof voidAdminRelaysRemoveOutput> {
	constructor(
		private relayService: RelayService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return await this.relayService.removeRelay(ps.inbox);
		});
	}
}
