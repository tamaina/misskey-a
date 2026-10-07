/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { emptyReversiInvitationsDefinition, emptyReversiInvitationsInput, emptyReversiInvitationsOutput } from '../../../contract/empty-input-endpoint-definitions.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { ReversiService } from '../../services/ReversiService.js';

const contractProjection = projectEndpointContract(emptyReversiInvitationsDefinition);

export const meta = {
	requireCredential: true,

	kind: 'read:account',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof emptyReversiInvitationsInput, typeof emptyReversiInvitationsOutput> {
	constructor(
		private userEntityService: UserEntityService,
		private reversiService: ReversiService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			const invitations = await this.reversiService.getInvitations(me);

			return await this.userEntityService.packMany(invitations, me);
		});
	}
}
