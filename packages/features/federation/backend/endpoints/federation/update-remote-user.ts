/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { voidFederationUpdateRemoteUserDefinition, voidFederationUpdateRemoteUserInput, voidFederationUpdateRemoteUserOutput } from '../../../contract/void-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import ms from 'ms';

import { ApPersonService } from '../../services/ApPersonService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

const contractProjection = projectEndpointContract(voidFederationUpdateRemoteUserDefinition);

export const meta = {
	tags: ['federation'],

	requireCredential: true,
	kind: 'read:account',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof voidFederationUpdateRemoteUserInput, typeof voidFederationUpdateRemoteUserOutput> {
	constructor(
		private getterService: GetterService,
		private apPersonService: ApPersonService,
	) {
		super(meta, contractProjection, async (ps) => {
			const user = await this.getterService.getRemoteUser(ps.userId);

			await this.apPersonService.updatePerson(user.uri!);
		});
	}
}
