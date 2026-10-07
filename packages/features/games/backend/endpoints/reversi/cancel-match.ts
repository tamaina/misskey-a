/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidReversiCancelMatchDefinition, voidReversiCancelMatchInput, voidReversiCancelMatchOutput } from '../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';

import { ReversiService } from '../../services/ReversiService.js';

const contractProjection = projectEndpointContract(voidReversiCancelMatchDefinition);

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidReversiCancelMatchInput, typeof voidReversiCancelMatchOutput> {
	constructor(
		private reversiService: ReversiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			if (ps.userId) {
				await this.reversiService.matchSpecificUserCancel(me, ps.userId);
				return;
			} else {
				await this.reversiService.matchAnyUserCancel(me);
			}
		});
	}
}
