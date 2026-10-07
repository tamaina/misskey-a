/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { unionUsersRelationDefinition, unionUsersRelationInput, unionUsersRelationOutput } from '../../../contract/union-endpoint-definitions.js';
import { Injectable } from '@nestjs/common';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';

const contractProjection = projectEndpointContract(unionUsersRelationDefinition);

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'read:account',

	description: 'Show the different kinds of relations between the authenticated user and the specified user(s).',

	res: contractProjection.response,
} as const;

export const paramDef = contractProjection.input;

@Injectable()
export class EndpointImplementation extends ContractEndpoint<typeof meta, typeof unionUsersRelationInput, typeof unionUsersRelationOutput> {
	constructor(
		private userEntityService: UserEntityService,
	) {
		super(meta, contractProjection, async (ps, me) => {
			return Array.isArray(ps.userId)
				? await this.userEntityService.getRelations(me.id, ps.userId).then(it => [...it.values()])
				: await this.userEntityService.getRelation(me.id, ps.userId).then(it => [it]);
		});
	}
}
